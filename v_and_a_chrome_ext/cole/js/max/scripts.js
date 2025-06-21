/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 96:
/***/ (() => {

/**
 * V&A API - Refactored Version with State Management
 * 
 * This version uses the state management system for better data flow
 * and component communication. It replaces direct component calls with
 * state-based updates.
 */

(function (window, $, Modernizr) {
  'use strict';

  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};

  // Create the V&A API instance
  var museumApi = null;
  var chosenSearchTerm = null;

  /**
   * Start function - initializes the API and begins the search process
   */
  async function start() {
    console.log("=== V&A API START FUNCTION CALLED ===");
    console.log("Initializing museum API...");
    try {
      // Create V&A API instance
      museumApi = SITE.MuseumApiFactory.create('vanda');

      // Initialize the API (loads user settings)
      await museumApi.initialize();

      // Test background script communication
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        console.log("Testing background script communication...");
        chrome.runtime.sendMessage({
          action: 'test'
        }, function (response) {
          console.log("Background script test response:", response);
        });
      }

      // Choose a search term and start the search process
      chosenSearchTerm = museumApi.chooseSearchTerm();
      await makeVaRequest(null, chosenSearchTerm);
    } catch (error) {
      console.error("Failed to initialize museum API:", error);
      SITE.throwError();
    }
  }

  /**
   * Make a V&A API request (maintains compatibility with existing code)
   */
  async function makeVaRequest(systemNumber, searchTerm, offset, limit, withImages, withDescription, after, random) {
    try {
      // Handle different request types based on parameters
      let expectResponse = 0;
      if (offset != null) {
        expectResponse = 1;
      } else if (systemNumber != null) {
        expectResponse = 2;
      }
      console.log("expectResponse = " + expectResponse);
      console.log("Chosen term = " + searchTerm);
      console.log("offset = " + offset);
      let searchParams = {
        searchTerm: searchTerm,
        offset: offset,
        limit: limit || "1",
        withImages: withImages || "1",
        withDescription: withDescription || "1",
        after: after,
        random: random || "0",
        hasImage: "1"
      };

      // Handle strict search mode
      if (museumApi.strictSearch) {
        searchParams.searchTerm = searchTerm;
        console.log("strictSearch = true");
      }

      // Make the search request
      const data = await museumApi.search(searchParams);

      // Process the response
      await processResponse(data, expectResponse);
    } catch (error) {
      console.error("API request failed:", error);
      if (museumApi.hasExceededMaxAttempts()) {
        console.log("maximum number of search attempts reached, try changing search terms");
        SITE.throwError();
      } else {
        // Retry with different search term
        chosenSearchTerm = museumApi.chooseSearchTerm();
        await makeVaRequest(null, chosenSearchTerm);
      }
    }
  }

  /**
   * Process API response (maintains compatibility with existing code)
   */
  async function processResponse(data, expectResponse) {
    console.log("Processing response:", data);
    if (expectResponse === 0) {
      // Initial search - get total count and choose random object
      const numRecords = data.records.length;
      if (numRecords > 0) {
        const randomOffset = pumkin.randomNum(0, data.info.record_count - 1);
        console.log("total results = " + data.info.record_count);
        console.log("randomOffset range: 0 to " + (data.info.record_count - 1));
        console.log("generated randomOffset = " + randomOffset);
        console.log("making query 2, with randomOffset of " + randomOffset);
        await makeVaRequest(null, chosenSearchTerm, randomOffset);
      } else {
        console.log("making a second request, no results found last time");
        chosenSearchTerm = museumApi.chooseSearchTerm();
        await makeVaRequest(null, chosenSearchTerm);
      }
      return;
    }
    if (expectResponse === 1) {
      // Got search results - get first object's system number
      const numRecords = data.records.length;
      console.log("There are " + numRecords + " objects available.");
      const whichObject = data.records[0];
      const systemNumber = whichObject.systemNumber;
      console.log("Selected object system number: " + systemNumber);
      await makeVaRequest(systemNumber);
      return;
    }

    // Process individual object data
    if (!data.records || data.records.length === 0) {
      console.log("No object found for system number, trying a different search term");
      chosenSearchTerm = museumApi.chooseSearchTerm();
      await makeVaRequest(null, chosenSearchTerm);
      return;
    }

    // Process the object data using the abstraction layer
    const objectData = museumApi.processObjectData(data);

    // Update the state with the new object data
    await updateStateWithObjectData(objectData);

    // Save to history if this is a final object (not a search step)
    if (expectResponse !== 0 && expectResponse !== 1) {
      await saveToHistoryWithState(objectData);
    }
  }

  /**
   * Update state with object data using state management
   */
  async function updateStateWithObjectData(objectData) {
    console.log("Updating state with object data:", objectData);
    try {
      // Use state management to update the object
      if (window.appState) {
        // Update current object
        window.appState.dispatch(objectActions.setCurrentObject(objectData));

        // Clear any previous errors
        window.appState.dispatch(errorActions.clearError());
        console.log("State updated successfully with object data");
      } else {
        // Fallback to direct component updates if state management not available
        console.warn("State management not available, using fallback");
        updateUIFallback(objectData);
      }
    } catch (error) {
      console.error("Error updating state with object data:", error);
      // Fallback to direct component updates
      updateUIFallback(objectData);
    }
  }

  /**
   * Save to history using state management
   */
  async function saveToHistoryWithState(objectData) {
    try {
      if (window.appState) {
        window.appState.dispatch(historyActions.addToHistory(objectData));
      } else {
        // Fallback to direct history management
        console.warn("State management not available, using fallback history");
        saveToHistoryFallback(objectData);
      }
    } catch (error) {
      console.error("Error saving to history with state:", error);
      // Fallback to direct history management
      saveToHistoryFallback(objectData);
    }
  }

  /**
   * Fallback UI update using direct DOM manipulation
   */
  function updateUIFallback(objectData) {
    console.log("Using fallback UI update");

    // Handle title length for CSS classes
    if (objectData.title.length > 42) {
      $("#title").addClass("reduced");
      $("#piece-date").addClass("reduced");
    }

    // Update basic information
    $("#creator-name").text(objectData.artist);
    $("#dates-alive").text(objectData.datesAlive);
    $("#title").html(objectData.title);
    if (objectData.date !== "") {
      $("#piece-date").text("(" + objectData.date + ")");
    }
    $("#place").html(objectData.place);

    // Handle image display
    if (objectData.imageUrl && objectData.imageUrl !== "") {
      $("#image").attr("src", objectData.imageUrl);

      // Build Pinterest URL
      let pinterestUrl = "https://www.pinterest.com/pin/create/button/";
      pinterestUrl += "?url=" + objectData.objectUrl;
      pinterestUrl += "&media=" + objectData.imageUrl;
      pinterestUrl += "&description=" + objectData.title;
      if (objectData.date !== "") {
        pinterestUrl += " (" + objectData.place + ", " + objectData.date + ")";
      }
      pinterestUrl += ", V%26A Collection";
      $("#pinterest-button").attr("href", pinterestUrl);
    } else {
      // No image available - show placeholder
      var $imageContainer = $('.object-image-wrapper');
      $imageContainer.html('<div class="image-placeholder"><p>Image not available</p><p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p></div>');
    }

    // Update links
    $("#page-link").attr("href", objectData.objectUrl);

    // Update Twitter URL
    let twitterUrl = "https://twitter.com/intent/tweet";
    twitterUrl += "?text=" + encodeURIComponent(objectData.title);
    if (objectData.date !== "") {
      twitterUrl += encodeURIComponent(" (" + objectData.place + ", " + objectData.date + ")");
    }
    twitterUrl += encodeURIComponent(", V&A Collection ");
    twitterUrl += encodeURIComponent(objectData.objectUrl);
    $("#twitter-button").attr("href", twitterUrl);

    // Update descriptions
    if (objectData.description && objectData.description !== "") {
      $("#object-description").html("<p>" + objectData.description + "</p>");
    }
    if (objectData.context && objectData.context !== "") {
      $("#object-context").html("<p>" + objectData.context + "</p>");
    }

    // Update technical information
    updateTechnicalInfoFallback(objectData);
  }

  /**
   * Update technical information using fallback method
   */
  function updateTechnicalInfoFallback(objectData) {
    function hideIfEmpty(selector, value) {
      if (value && value !== "") {
        $(selector).text(value);
        $(selector).closest('section').show();
      } else {
        $(selector).closest('section').hide();
      }
    }
    hideIfEmpty("#physical-description", objectData.physicalDescription);
    hideIfEmpty("#tech-info-place", objectData.place);
    hideIfEmpty("#tech-info-piece-date", objectData.date);
    hideIfEmpty("#tech-info-creator-name", objectData.artist);
    hideIfEmpty("#tech-info-materials", objectData.materials);
    hideIfEmpty("#dimensions", objectData.dimensions);
    hideIfEmpty("#museum-location", objectData.museumLocation);
    hideIfEmpty("#museum-number", objectData.objectNumber);
  }

  /**
   * Fallback history saving using direct DOM manipulation
   */
  function saveToHistoryFallback(objectData) {
    console.log("Using fallback history saving");

    // This would be the original history saving logic
    // For now, we'll just log that we're using fallback
    console.log("Fallback history save for object:", objectData.title);
  }

  /**
   * Show loading state using state management
   */
  function showLoading() {
    if (window.appState) {
      window.appState.dispatch(loadingActions.startLoading());
    }
  }

  /**
   * Hide loading state using state management
   */
  function hideLoading() {
    if (window.appState) {
      window.appState.dispatch(loadingActions.stopLoading());
    }
  }

  /**
   * Show error using state management
   */
  function showError(error) {
    if (window.appState) {
      window.appState.dispatch(errorActions.setError(error));
      window.appState.dispatch(uiActions.openErrorOverlay());
    } else {
      // Fallback error handling
      SITE.throwError();
    }
  }

  // Public API
  // ----------------------------------------------------

  // Expose functions to global scope
  SITE.start = start;
  SITE.makeVaRequest = makeVaRequest;
  SITE.processResponse = processResponse;
  SITE.showLoading = showLoading;
  SITE.hideLoading = hideLoading;
  SITE.showError = showError;

  // Initialize when called
  if (typeof SITE.initMain !== 'undefined') {
    // Wait for main initialization to complete
    const checkInit = setInterval(() => {
      if (window.componentManager && window.componentManager.isReady()) {
        clearInterval(checkInit);
        console.log("V&A API ready to start");
      }
    }, 100);
  }
})(window, jQuery, Modernizr);

/***/ }),

/***/ 127:
/***/ ((module) => {

/**
 * Base Component Class
 * 
 * Provides common functionality for all UI components including:
 * - Event handling
 * - Lifecycle management
 * - DOM manipulation utilities
 * - Error handling
 */

class BaseComponent {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.elements = {};
    this.events = {};
    this.isInitialized = false;

    // Bind methods to preserve context
    this.handleEvent = this.handleEvent.bind(this);
    this.destroy = this.destroy.bind(this);
  }

  /**
   * Initialize the component
   */
  async init() {
    try {
      await this.beforeInit();
      this.cacheElements();
      this.bindEvents();
      await this.afterInit();
      this.isInitialized = true;
      console.log(`[${this.name}] Component initialized`);
    } catch (error) {
      console.error(`[${this.name}] Failed to initialize:`, error);
      throw error;
    }
  }

  /**
   * Hook called before initialization
   */
  async beforeInit() {
    // Override in subclasses
  }

  /**
   * Cache DOM elements used by this component
   */
  cacheElements() {
    // Override in subclasses
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Override in subclasses
  }

  /**
   * Hook called after initialization
   */
  async afterInit() {
    // Override in subclasses
  }

  /**
   * Generic event handler
   */
  handleEvent(event, handler) {
    try {
      handler.call(this, event);
    } catch (error) {
      console.error(`[${this.name}] Event handler error:`, error);
    }
  }

  /**
   * Add event listener with error handling
   */
  addEvent(element, eventType, handler) {
    if (!element) {
      console.warn(`[${this.name}] Cannot add event to null element`);
      return;
    }
    const boundHandler = event => this.handleEvent(event, handler);
    element.addEventListener(eventType, boundHandler);

    // Store for cleanup
    if (!this.events[eventType]) {
      this.events[eventType] = [];
    }
    this.events[eventType].push({
      element,
      handler: boundHandler
    });
  }

  /**
   * Remove event listeners
   */
  removeEvents() {
    Object.keys(this.events).forEach(eventType => {
      this.events[eventType].forEach(({
        element,
        handler
      }) => {
        element.removeEventListener(eventType, handler);
      });
    });
    this.events = {};
  }

  /**
   * Show element with optional animation
   */
  show(element, animation = 'fadeIn') {
    if (!element) return;
    switch (animation) {
      case 'fadeIn':
        $(element).fadeIn();
        break;
      case 'slideDown':
        $(element).slideDown();
        break;
      default:
        $(element).show();
    }
  }

  /**
   * Hide element with optional animation
   */
  hide(element, animation = 'fadeOut') {
    if (!element) return;
    switch (animation) {
      case 'fadeOut':
        $(element).fadeOut();
        break;
      case 'slideUp':
        $(element).slideUp();
        break;
      default:
        $(element).hide();
    }
  }

  /**
   * Add loading state to element
   */
  setLoading(element, isLoading = true) {
    if (!element) return;
    if (isLoading) {
      $(element).addClass('loading');
    } else {
      $(element).removeClass('loading');
    }
  }

  /**
   * Update element text safely
   */
  setText(element, text) {
    if (!element) return;
    if (text === null || text === undefined) {
      text = '';
    }
    $(element).text(text);
  }

  /**
   * Update element HTML safely
   */
  setHTML(element, html) {
    if (!element) return;
    if (html === null || html === undefined) {
      html = '';
    }
    $(element).html(html);
  }

  /**
   * Set element attribute safely
   */
  setAttribute(element, attribute, value) {
    if (!element) return;
    if (value === null || value === undefined) {
      $(element).removeAttr(attribute);
    } else {
      $(element).attr(attribute, value);
    }
  }

  /**
   * Add/remove CSS classes
   */
  toggleClass(element, className, condition) {
    if (!element) return;
    if (condition) {
      $(element).addClass(className);
    } else {
      $(element).removeClass(className);
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    try {
      this.removeEvents();
      this.elements = {};
      this.isInitialized = false;
      console.log(`[${this.name}] Component destroyed`);
    } catch (error) {
      console.error(`[${this.name}] Error during destruction:`, error);
    }
  }
}

// Export for use in other modules
if ( true && module.exports) {
  module.exports = BaseComponent;
} else if (typeof window !== 'undefined') {
  window.BaseComponent = BaseComponent;
}

/***/ }),

/***/ 158:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* unused harmony export selectors */
/* module decorator */ module = __webpack_require__.hmd(module);
/**
 * State Connector
 * 
 * Provides a clean interface for components to connect to the state management system.
 * Handles state subscriptions, updates, and component lifecycle management.
 */

class StateConnector {
  constructor(appState) {
    this.appState = appState;
    this.connectedComponents = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Connect a component to the state
   */
  connect(component, selectors = {}) {
    if (!component || !component.name) {
      console.error('[StateConnector] Invalid component provided');
      return null;
    }
    const componentId = component.name;

    // Store component reference
    this.connectedComponents.set(componentId, component);

    // Create subscriptions for each selector
    const subscriptions = {};
    Object.keys(selectors).forEach(selectorName => {
      const selector = selectors[selectorName];
      const unsubscribe = this.appState.subscribe(state => this.handleStateUpdate(componentId, selectorName, state), selector);
      subscriptions[selectorName] = unsubscribe;
    });

    // Store subscriptions
    this.subscriptions.set(componentId, subscriptions);

    // Provide state methods to component
    this.attachStateMethods(component);
    console.log(`[StateConnector] Connected component: ${componentId}`);
    return {
      disconnect: () => this.disconnect(componentId),
      dispatch: action => this.appState.dispatch(action),
      getState: selector => this.appState.getState(selector)
    };
  }

  /**
   * Disconnect a component from the state
   */
  disconnect(componentId) {
    const subscriptions = this.subscriptions.get(componentId);
    if (subscriptions) {
      // Unsubscribe from all selectors
      Object.values(subscriptions).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.subscriptions.delete(componentId);
    }
    this.connectedComponents.delete(componentId);
    console.log(`[StateConnector] Disconnected component: ${componentId}`);
  }

  /**
   * Handle state updates for a component
   */
  handleStateUpdate(componentId, selectorName, state) {
    const component = this.connectedComponents.get(componentId);
    if (!component) {
      console.warn(`[StateConnector] Component not found: ${componentId}`);
      return;
    }
    try {
      // Call the component's state update method
      const methodName = `on${selectorName.charAt(0).toUpperCase() + selectorName.slice(1)}Update`;
      if (typeof component[methodName] === 'function') {
        component[methodName](state);
      } else {
        // Fallback to generic update method
        if (typeof component.onStateUpdate === 'function') {
          component.onStateUpdate(selectorName, state);
        }
      }
    } catch (error) {
      console.error(`[StateConnector] Error updating component ${componentId}:`, error);
    }
  }

  /**
   * Attach state methods to a component
   */
  attachStateMethods(component) {
    // Attach dispatch method
    component.dispatch = action => {
      this.appState.dispatch(action);
    };

    // Attach getState method
    component.getState = selector => {
      return this.appState.getState(selector);
    };

    // Attach convenience methods
    component.getCurrentObject = () => {
      return this.appState.getCurrentObject();
    };
    component.getHistory = () => {
      return this.appState.getHistory();
    };
    component.getSettings = () => {
      return this.appState.getSettings();
    };
    component.getUIState = () => {
      return this.appState.getUIState();
    };
    component.getAPIState = () => {
      return this.appState.getAPIState();
    };
    component.isLoading = () => {
      return this.appState.isLoading();
    };
    component.getError = () => {
      return this.appState.getError();
    };
  }

  /**
   * Dispatch an action to the state
   */
  dispatch(action) {
    this.appState.dispatch(action);
  }

  /**
   * Get current state
   */
  getState(selector = null) {
    return this.appState.getState(selector);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback, selector = null) {
    return this.appState.subscribe(callback, selector);
  }

  /**
   * Get all connected components
   */
  getConnectedComponents() {
    return Array.from(this.connectedComponents.keys());
  }

  /**
   * Disconnect all components
   */
  disconnectAll() {
    const componentIds = Array.from(this.connectedComponents.keys());
    componentIds.forEach(id => this.disconnect(id));
  }
}

// Common state selectors
const selectors = {
  // Object selectors
  currentObject: state => state.currentObject,
  isLoading: state => state.isLoading,
  error: state => state.error,
  // History selectors
  history: state => state.history,
  historyCount: state => state.history.length,
  // UI selectors
  ui: state => state.ui,
  sidePanelOpen: state => state.ui.sidePanelOpen,
  historyOverlayOpen: state => state.ui.historyOverlayOpen,
  errorOverlayOpen: state => state.ui.errorOverlayOpen,
  // Settings selectors
  settings: state => state.settings,
  searchTerms: state => state.settings.searchTerms,
  strictSearch: state => state.settings.strictSearch,
  currentMuseum: state => state.settings.currentMuseum,
  // API selectors
  api: state => state.api,
  currentSearchTerm: state => state.api.currentSearchTerm,
  searchAttempts: state => state.api.searchAttempts,
  maxSearchAttempts: state => state.api.maxSearchAttempts,
  // Composite selectors
  hasReachedMaxAttempts: state => state.api.searchAttempts >= state.api.maxSearchAttempts,
  hasHistory: state => state.history.length > 0,
  hasCurrentObject: state => state.currentObject !== null
};

// Export for use in other modules
if ( true && module.exports) {
  module.exports = {
    StateConnector,
    selectors
  };
} else if (typeof window !== 'undefined') {
  window.StateConnector = StateConnector;
  window.stateSelectors = selectors;
}

/***/ }),

/***/ 162:
/***/ (() => {

/**
 * Main Application - Refactored Version
 * 
 * This version uses the modular component system for better maintainability
 * and extensibility. It replaces the monolithic approach with a clean
 * component-based architecture.
 */

(function (window, $, Modernizr, screenfull, FastClick) {
  'use strict';

  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};

  // Global variables
  var $window = null;
  var $body = null;
  var WIDTH = null;
  var HEIGHT = null;
  var isMobile = null;
  var isTablet = null;
  var isDevice = null;
  var isTouch = null;
  var browser;
  var $wrapper;

  // Component Manager instance
  var componentManager = null;

  /**
   * Initialize the application
   */
  async function initMain() {
    try {
      console.log('=== MAIN APPLICATION INITIALIZATION ===');

      // Define global variables
      defineVars();

      // Initialize component manager
      await initComponentManager();

      // Initialize remaining functionality
      initFastclick();
      initResizeHandlers();
      initScrollHandlers();
      console.log('Main application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize main application:', error);
      throw error;
    }
  }

  /**
   * Define global variables
   */
  function defineVars() {
    var gv = window.gv;
    if (!gv) {
      console.error('Global variables not available');
      return;
    }
    $window = gv.$window;
    $body = gv.$body;
    WIDTH = gv.WIDTH;
    HEIGHT = gv.HEIGHT;
    $wrapper = gv.$wrapper;
    isMobile = gv.deviceVariables.isMobile;
    isTablet = gv.deviceVariables.isTablet;
    isDevice = gv.deviceVariables.isDevice;
    isTouch = gv.deviceVariables.isTouch;
    browser = gv.browser;
    console.log('Global variables defined');
  }

  /**
   * Initialize the component manager
   */
  async function initComponentManager() {
    try {
      // Create component manager with configuration
      componentManager = new ComponentManager({
        maxHistoryItems: 10,
        objectDisplay: {
          // Object display specific options
        },
        history: {
          // History specific options
        },
        sidePanel: {
          // Side panel specific options
        }
      });

      // Initialize all components
      await componentManager.init();

      // Make component manager globally available
      window.componentManager = componentManager;
      console.log('Component Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Component Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize FastClick for mobile
   */
  function initFastclick() {
    if (typeof FastClick !== 'undefined') {
      FastClick.attach(document.body);
      console.log('FastClick initialized');
    }
  }

  /**
   * Initialize resize handlers
   */
  function initResizeHandlers() {
    if (!$window) return;

    // Initial resize
    onResize();
    onThrottledResize();
    onDebouncedResize();

    // Bind resize events
    $window.on('resize', onResize);
    $window.on('resize', throttledResize);
    $window.on('resize', debouncedResize);
    console.log('Resize handlers initialized');
  }

  /**
   * Initialize scroll handlers
   */
  function initScrollHandlers() {
    const textContent = document.querySelector('.text-content-column');
    if (textContent) {
      onThrottledScroll();
      $(textContent).on('scroll', throttledScroll);
      console.log('Scroll handlers initialized');
    }
  }

  // Resize event handlers
  // ----------------------------------------------------

  function onResize() {
    // Update global dimensions
    if ($window) {
      WIDTH = $window.width();
      HEIGHT = $window.height();
    }
  }
  function onThrottledResize() {
    // Handle throttled resize events
    // Components will handle their own resize logic
  }
  function onDebouncedResize() {
    // Handle debounced resize events
    // Components will handle their own resize logic
  }

  // Scroll event handlers
  // ----------------------------------------------------

  function onThrottledScroll() {
    // Handle throttled scroll events
    // Components will handle their own scroll logic
  }

  // Throttle and debounce functions
  // ----------------------------------------------------

  function throttledResize() {
    if (window.throttledResizeTimer) {
      clearTimeout(window.throttledResizeTimer);
    }
    window.throttledResizeTimer = setTimeout(onThrottledResize, 100);
  }
  function debouncedResize() {
    if (window.debouncedResizeTimer) {
      clearTimeout(window.debouncedResizeTimer);
    }
    window.debouncedResizeTimer = setTimeout(onDebouncedResize, 250);
  }
  function throttledScroll() {
    if (window.throttledScrollTimer) {
      clearTimeout(window.throttledScrollTimer);
    }
    window.throttledScrollTimer = setTimeout(onThrottledScroll, 100);
  }

  // Error handling
  // ----------------------------------------------------

  function throwError() {
    if (componentManager) {
      componentManager.showError();
    } else {
      // Fallback error handling
      const overlay = document.querySelector('.overlay');
      if (overlay) {
        overlay.classList.remove('closed');
        overlay.classList.add('open', 'for-warning');
        $(overlay).fadeIn(500);
      }
    }
  }

  // Public API
  // ----------------------------------------------------

  // Expose functions to global scope
  SITE.initMain = initMain;
  SITE.throwError = throwError;

  // Expose component manager methods for backward compatibility
  SITE.updateObjectDisplay = function (objectData) {
    if (componentManager) {
      return componentManager.updateObjectDisplay(objectData);
    }
  };
  SITE.addToHistory = function (objectData) {
    if (componentManager) {
      return componentManager.addToHistory(objectData);
    }
  };
  SITE.showLoading = function () {
    if (componentManager) {
      componentManager.showLoading();
    }
  };
  SITE.hideLoading = function () {
    if (componentManager) {
      componentManager.hideLoading();
    }
  };
  SITE.getCurrentObject = function () {
    if (componentManager) {
      return componentManager.getCurrentObject();
    }
    return null;
  };
  SITE.getHistory = function () {
    if (componentManager) {
      return componentManager.getHistory();
    }
    return [];
  };

  // Cleanup function
  SITE.cleanup = async function () {
    if (componentManager) {
      await componentManager.destroy();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMain);
  } else {
    initMain();
  }
})(window, jQuery, Modernizr, screenfull, FastClick);

/***/ }),

/***/ 169:
/***/ ((module) => {

/**
 * Side Panel Component
 * 
 * Manages the side panel functionality including:
 * - About information display
 * - Search terms display
 * - Settings navigation
 * - Panel open/close animations
 */

class SidePanelComponent extends BaseComponent {
  constructor(options = {}) {
    super('SidePanel', options);
    this.isOpen = false;
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      sidePanel: document.querySelector('.side-panel'),
      sidePanelOpenBtn: document.querySelector('.more'),
      sidePanelCloseBtn: document.querySelector('.close-side-panel'),
      searchTerms: document.getElementById('search-terms'),
      goToOptionsBtn: document.querySelector('.go-to-options')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Side panel open button
    if (this.elements.sidePanelOpenBtn) {
      this.addEvent(this.elements.sidePanelOpenBtn, 'click', this.handlePanelToggle);
    }

    // Side panel close button
    if (this.elements.sidePanelCloseBtn) {
      this.addEvent(this.elements.sidePanelCloseBtn, 'click', this.handlePanelClose);
    }

    // Go to options button
    if (this.elements.goToOptionsBtn) {
      this.addEvent(this.elements.goToOptionsBtn, 'click', this.handleGoToOptions);
    }

    // Close panel when clicking outside
    this.addEvent(document, 'click', this.handleOutsideClick);
  }

  /**
   * Handle panel toggle
   */
  handlePanelToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * Handle panel close
   */
  handlePanelClose(event) {
    event.preventDefault();
    event.stopPropagation();
    this.closePanel();
  }

  /**
   * Handle outside click to close panel
   */
  handleOutsideClick(event) {
    if (!this.isOpen) return;
    const sidePanel = this.elements.sidePanel;
    const openBtn = this.elements.sidePanelOpenBtn;
    if (sidePanel && !sidePanel.contains(event.target) && openBtn && !openBtn.contains(event.target)) {
      this.closePanel();
    }
  }

  /**
   * Handle go to options button click
   */
  handleGoToOptions(event) {
    event.preventDefault();
    try {
      if (chrome.runtime.openOptionsPage) {
        // New way to open options pages, if supported (Chrome 42+)
        chrome.runtime.openOptionsPage();
      } else {
        // Reasonable fallback
        window.open(chrome.runtime.getURL('/src/options/index.html'));
      }
    } catch (error) {
      console.error('[SidePanel] Error opening options page:', error);
    }
  }

  /**
   * Open the side panel
   */
  openPanel() {
    if (!this.elements.sidePanel) return;
    this.elements.sidePanel.classList.add('open');
    this.isOpen = true;

    // Update body class
    document.body.classList.add('side-panel-open');
    document.body.classList.remove('side-panel-closed');
    console.log('[SidePanel] Panel opened');
  }

  /**
   * Close the side panel
   */
  closePanel() {
    if (!this.elements.sidePanel) return;
    this.elements.sidePanel.classList.remove('open');
    this.isOpen = false;

    // Update body class
    document.body.classList.remove('side-panel-open');
    document.body.classList.add('side-panel-closed');
    console.log('[SidePanel] Panel closed');
  }

  /**
   * Toggle panel state
   */
  togglePanel() {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * Update search terms display
   */
  updateSearchTerms(searchTerms) {
    if (!this.elements.searchTerms) return;
    if (!searchTerms || searchTerms.length === 0) {
      this.setText(this.elements.searchTerms, 'All objects in the collection');
    } else {
      // Format search terms for display
      const formattedTerms = this.formatSearchTerms(searchTerms);
      this.setText(this.elements.searchTerms, formattedTerms);
    }
  }

  /**
   * Format search terms for display
   */
  formatSearchTerms(searchTerms) {
    if (Array.isArray(searchTerms)) {
      return searchTerms.join(', ');
    } else if (typeof searchTerms === 'string') {
      return searchTerms;
    } else {
      return 'All objects in the collection';
    }
  }

  /**
   * Load search terms from storage and update display
   */
  async loadSearchTerms() {
    try {
      if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
        const result = await new Promise(resolve => {
          chrome.storage.sync.get(['searchTerms'], resolve);
        });
        if (result.searchTerms) {
          this.updateSearchTerms(result.searchTerms);
        } else {
          this.updateSearchTerms([]);
        }
      }
    } catch (error) {
      console.error('[SidePanel] Error loading search terms:', error);
      this.updateSearchTerms([]);
    }
  }

  /**
   * Update about information
   */
  updateAboutInfo(info = {}) {
    var _this$elements$sidePa;
    const defaultInfo = {
      title: 'About',
      description: 'Cole is an experiment in search and discovery — made by product designers Alex Charlton and Gala Jover, with the kind support of the V&A museum.',
      contact: {
        email: 'hello@cole-extension.com',
        twitter: 'https://twitter.com/cole_extension',
        chromeStore: 'https://chrome.google.com/webstore/detail/cole/oaalhdkppdbffcjmlmdlmhdlfbingkga'
      },
      links: {
        alexTwitter: 'https://twitter.com/_____alexc',
        galaWebsite: 'https://gjover.com',
        vaTwitter: 'https://twitter.com/V_and_A'
      }
    };
    const aboutInfo = {
      ...defaultInfo,
      ...info
    };

    // Update about section if it exists
    const aboutSection = (_this$elements$sidePa = this.elements.sidePanel) === null || _this$elements$sidePa === void 0 ? void 0 : _this$elements$sidePa.querySelector('.text-content');
    if (aboutSection) {
      const aboutHTML = this.buildAboutHTML(aboutInfo);
      const aboutElement = aboutSection.querySelector('h4 + p');
      if (aboutElement) {
        this.setHTML(aboutElement, aboutHTML);
      }
    }
  }

  /**
   * Build about section HTML
   */
  buildAboutHTML(info) {
    return `
            ${info.description.replace('Alex Charlton', `<a href="${info.links.alexTwitter}" target="_blank">Alex Charlton</a>`).replace('Gala Jover', `<a href="${info.links.galaWebsite}" target="_blank">Gala Jover</a>`).replace('V&A museum', `<a href="${info.links.vaTwitter}" target="_blank">V&A museum</a>`)}
        `;
  }

  /**
   * Update contact information
   */
  updateContactInfo(contact = {}) {
    var _this$elements$sidePa2;
    const defaultContact = {
      email: 'hello@cole-extension.com',
      twitter: 'https://twitter.com/cole_extension',
      chromeStore: 'https://chrome.google.com/webstore/detail/cole/oaalhdkppdbffcjmlmdlmhdlfbingkga'
    };
    const contactInfo = {
      ...defaultContact,
      ...contact
    };

    // Update contact section if it exists
    const contactSection = (_this$elements$sidePa2 = this.elements.sidePanel) === null || _this$elements$sidePa2 === void 0 ? void 0 : _this$elements$sidePa2.querySelector('.text-content');
    if (contactSection) {
      const contactHTML = this.buildContactHTML(contactInfo);
      const contactElement = contactSection.querySelector('h4:contains("Get in touch") + p');
      if (contactElement) {
        this.setHTML(contactElement, contactHTML);
      }
    }
  }

  /**
   * Build contact section HTML
   */
  buildContactHTML(contact) {
    return `
            Send your feedback to <a href="mailto:${contact.email}">${contact.email}</a><br>
            Follow us on <a href="${contact.twitter}" target="_blank">Twitter</a><br>
            Leave a review on the <a href="${contact.chromeStore}" target="_blank">Chrome webstore</a>
        `;
  }

  /**
   * Check if panel is open
   */
  isPanelOpen() {
    return this.isOpen;
  }

  /**
   * Get panel element
   */
  getPanelElement() {
    return this.elements.sidePanel;
  }

  /**
   * Initialize with default content
   */
  async afterInit() {
    // Load search terms from storage
    await this.loadSearchTerms();

    // Update about and contact info
    this.updateAboutInfo();
    this.updateContactInfo();
  }
}

// Export for use in other modules
if ( true && module.exports) {
  module.exports = SidePanelComponent;
} else if (typeof window !== 'undefined') {
  window.SidePanelComponent = SidePanelComponent;
}

/***/ }),

/***/ 228:
/***/ ((module) => {

/**
 * History Component
 * 
 * Manages the history functionality including:
 * - Displaying previously viewed objects
 * - History overlay management
 * - Chrome storage integration
 * - History object interactions
 */

class HistoryComponent extends BaseComponent {
  constructor(options = {}) {
    super('History', options);
    this.history = [];
    this.maxHistoryItems = options.maxHistoryItems || 10;
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      overlay: document.querySelector('.overlay'),
      historyWrapper: document.querySelector('.history-wrapper'),
      historyObjects: document.getElementById('history-objects'),
      historyOpenBtn: document.querySelector('.history'),
      overlayCloseBtn: document.querySelector('.close-overlay'),
      loading: document.querySelector('.history-wrapper .loading')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // History button click
    if (this.elements.historyOpenBtn) {
      this.addEvent(this.elements.historyOpenBtn, 'click', this.handleHistoryOpen);
    }

    // Overlay close button
    if (this.elements.overlayCloseBtn) {
      this.addEvent(this.elements.overlayCloseBtn, 'click', this.handleOverlayClose);
    }

    // Delegate events for history objects
    if (this.elements.historyObjects) {
      this.addEvent(this.elements.historyObjects, 'click', this.handleHistoryObjectClick);
    }
  }

  /**
   * Load history from Chrome storage
   */
  async loadHistory() {
    try {
      if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['objectHistory'], resolve);
        });
        if (result.objectHistory) {
          this.history = result.objectHistory;
          console.log(`[History] Loaded ${this.history.length} items from storage`);
        }
      }
    } catch (error) {
      console.error('[History] Error loading history:', error);
    }
  }

  /**
   * Save history to Chrome storage
   */
  async saveHistory() {
    try {
      if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
        await new Promise(resolve => {
          chrome.storage.local.set({
            objectHistory: this.history
          }, resolve);
        });
        console.log(`[History] Saved ${this.history.length} items to storage`);
      }
    } catch (error) {
      console.error('[History] Error saving history:', error);
    }
  }

  /**
   * Add object to history
   */
  async addToHistory(objectData) {
    if (!objectData || !objectData.objectNumber) {
      console.warn('[History] Invalid object data for history');
      return;
    }
    try {
      // Remove existing entry if it exists
      this.history = this.history.filter(item => item.objectNumber !== objectData.objectNumber);

      // Add to beginning of array
      this.history.unshift({
        objectNumber: objectData.objectNumber,
        title: objectData.title,
        artist: objectData.artist,
        date: objectData.date,
        imageUrl: objectData.imageUrl,
        vaCollectionsUrl: objectData.objectUrl,
        timestamp: Date.now()
      });

      // Limit history size
      if (this.history.length > this.maxHistoryItems) {
        this.history = this.history.slice(0, this.maxHistoryItems);
      }

      // Save to storage
      await this.saveHistory();
      console.log(`[History] Added object to history: ${objectData.title}`);
    } catch (error) {
      console.error('[History] Error adding to history:', error);
    }
  }

  /**
   * Handle history button click
   */
  handleHistoryOpen(event) {
    event.preventDefault();
    if (this.elements.overlay && this.elements.overlay.classList.contains('closed')) {
      this.showHistory();
    }
  }

  /**
   * Handle overlay close button click
   */
  handleOverlayClose(event) {
    event.preventDefault();
    this.hideHistory();
  }

  /**
   * Handle history object click
   */
  handleHistoryObjectClick(event) {
    const historyObject = event.target.closest('.history-object');
    if (!historyObject) return;
    event.preventDefault();
    const objectNumber = historyObject.dataset.objectNumber;
    const url = historyObject.href;

    // Open in new tab
    if (url) {
      window.open(url, '_blank');
    }
    console.log(`[History] Clicked history object: ${objectNumber}`);
  }

  /**
   * Show history overlay
   */
  showHistory() {
    if (!this.elements.overlay) return;

    // Update overlay classes
    this.elements.overlay.classList.remove('closed');
    this.elements.overlay.classList.add('open', 'for-history');

    // Show overlay with animation
    $(this.elements.overlay).fadeIn(500, () => {
      this.populateHistory();
    });
  }

  /**
   * Hide history overlay
   */
  hideHistory() {
    if (!this.elements.overlay) return;
    $(this.elements.overlay).fadeOut(500, () => {
      this.elements.overlay.classList.remove('open', 'for-history');
      this.elements.overlay.classList.add('closed');
      this.clearHistoryDisplay();
    });
  }

  /**
   * Populate history display
   */
  populateHistory() {
    if (!this.elements.historyObjects) return;

    // Show loading state
    if (this.elements.loading) {
      this.elements.loading.classList.add('loaded');
    }

    // Clear existing content
    this.clearHistoryDisplay();

    // Check if history is empty
    if (!this.history || this.history.length === 0) {
      this.setHTML(this.elements.historyObjects, '<p class="no-history">No objects viewed yet. Start exploring the V&A collection!</p>');
      return;
    }

    // Build history objects HTML
    let historyHTML = '';
    this.history.forEach((item, index) => {
      historyHTML += this.buildHistoryObjectHTML(item, index);
    });
    this.setHTML(this.elements.historyObjects, historyHTML);

    // Add image load handlers
    this.addImageLoadHandlers();
  }

  /**
   * Build HTML for a single history object
   */
  buildHistoryObjectHTML(item, index) {
    return `
            <a class="history-object hide-until-loaded" 
               data-object-number="${item.objectNumber}" 
               href="${item.vaCollectionsUrl}"
               title="View this item in the V&A archive">
                <div class="history-object-image-holder" 
                     style="background-image: url('${item.imageUrl}');">
                </div>
                <img src="${item.imageUrl}" 
                     class="image-holder-for-loading" 
                     id="image-holder-${index}">
                <div class="history-object-info">
                    <p><strong>${item.title}</strong>, ${item.date}</p>
                    <p>${item.artist}</p>
                </div>
            </a>
        `;
  }

  /**
   * Add image load handlers for history objects
   */
  addImageLoadHandlers() {
    this.history.forEach((item, index) => {
      const imageElement = document.getElementById(`image-holder-${index}`);
      if (imageElement) {
        imageElement.addEventListener('load', () => {
          const parent = imageElement.parentElement;
          if (parent) {
            parent.classList.add('loaded');
          }
          imageElement.remove(); // Prevent memory leaks
        });
      }
    });
  }

  /**
   * Clear history display
   */
  clearHistoryDisplay() {
    if (this.elements.historyObjects) {
      this.setHTML(this.elements.historyObjects, '');
    }
  }

  /**
   * Get history array
   */
  getHistory() {
    return [...this.history]; // Return copy to prevent external modification
  }

  /**
   * Clear all history
   */
  async clearHistory() {
    this.history = [];
    await this.saveHistory();
    console.log('[History] History cleared');
  }

  /**
   * Remove specific object from history
   */
  async removeFromHistory(objectNumber) {
    this.history = this.history.filter(item => item.objectNumber !== objectNumber);
    await this.saveHistory();
    console.log(`[History] Removed object from history: ${objectNumber}`);
  }

  /**
   * Get history count
   */
  getHistoryCount() {
    return this.history.length;
  }

  /**
   * Check if object is in history
   */
  isInHistory(objectNumber) {
    return this.history.some(item => item.objectNumber === objectNumber);
  }
}

// Export for use in other modules
if ( true && module.exports) {
  module.exports = HistoryComponent;
} else if (typeof window !== 'undefined') {
  window.HistoryComponent = HistoryComponent;
}

/***/ }),

/***/ 262:
/***/ ((module) => {

/**
 * Application State Management
 * 
 * Centralized state management for the Chrome extension.
 * Provides predictable state updates, persistence, and change notifications.
 */

class AppState {
  constructor(options = {}) {
    this.state = {
      // Current object state
      currentObject: null,
      isLoading: false,
      error: null,
      // History state
      history: [],
      maxHistoryItems: options.maxHistoryItems || 10,
      // UI state
      ui: {
        sidePanelOpen: false,
        historyOverlayOpen: false,
        errorOverlayOpen: false
      },
      // Settings state
      settings: {
        searchTerms: [],
        strictSearch: false,
        currentMuseum: 'vanda'
      },
      // API state
      api: {
        currentSearchTerm: null,
        searchAttempts: 0,
        maxSearchAttempts: 5
      }
    };
    this.subscribers = new Map();
    this.subscriberId = 0;
    this.isInitialized = false;

    // Bind methods
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.dispatch = this.dispatch.bind(this);
  }

  /**
   * Initialize the state manager
   */
  async init() {
    try {
      console.log('[AppState] Initializing state manager...');

      // Load persisted state from Chrome storage
      await this.loadPersistedState();

      // Set up storage change listener
      this.setupStorageListener();
      this.isInitialized = true;
      console.log('[AppState] State manager initialized');
    } catch (error) {
      console.error('[AppState] Failed to initialize state manager:', error);
      throw error;
    }
  }

  /**
   * Load persisted state from Chrome storage
   */
  async loadPersistedState() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await new Promise(resolve => {
          chrome.storage.local.get(['objectHistory', 'searchTerms', 'strictSearch', 'currentMuseum'], resolve);
        });

        // Update state with persisted data
        if (result.objectHistory) {
          this.state.history = result.objectHistory;
        }
        if (result.searchTerms) {
          this.state.settings.searchTerms = result.searchTerms;
        }
        if (result.strictSearch !== undefined) {
          this.state.settings.strictSearch = result.strictSearch;
        }
        if (result.currentMuseum) {
          this.state.settings.currentMuseum = result.currentMuseum;
        }
        console.log('[AppState] Loaded persisted state');
      }
    } catch (error) {
      console.error('[AppState] Error loading persisted state:', error);
    }
  }

  /**
   * Save state to Chrome storage
   */
  async savePersistedState() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await new Promise(resolve => {
          chrome.storage.local.set({
            objectHistory: this.state.history,
            searchTerms: this.state.settings.searchTerms,
            strictSearch: this.state.settings.strictSearch,
            currentMuseum: this.state.settings.currentMuseum
          }, resolve);
        });
        console.log('[AppState] Saved persisted state');
      }
    } catch (error) {
      console.error('[AppState] Error saving persisted state:', error);
    }
  }

  /**
   * Set up Chrome storage change listener
   */
  setupStorageListener() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        // Update local state when storage changes
        Object.keys(changes).forEach(key => {
          const change = changes[key];
          switch (key) {
            case 'objectHistory':
              this.state.history = change.newValue || [];
              this.notifySubscribers('history');
              break;
            case 'searchTerms':
              this.state.settings.searchTerms = change.newValue || [];
              this.notifySubscribers('settings');
              break;
            case 'strictSearch':
              this.state.settings.strictSearch = change.newValue || false;
              this.notifySubscribers('settings');
              break;
            case 'currentMuseum':
              this.state.settings.currentMuseum = change.newValue || 'vanda';
              this.notifySubscribers('settings');
              break;
          }
        });
      });
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback, selector = null) {
    const id = ++this.subscriberId;
    this.subscribers.set(id, {
      callback,
      selector
    });

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(id) {
    this.subscribers.delete(id);
  }

  /**
   * Get current state (or subset if selector provided)
   */
  getState(selector = null) {
    if (selector) {
      return selector(this.state);
    }
    return {
      ...this.state
    }; // Return copy to prevent direct mutation
  }

  /**
   * Set state with partial update
   */
  setState(partialState) {
    const prevState = {
      ...this.state
    };

    // Deep merge the state
    this.state = this.deepMerge(this.state, partialState);

    // Notify subscribers
    this.notifySubscribers(partialState);

    // Save to storage if needed
    this.savePersistedState();
    console.log('[AppState] State updated:', partialState);
  }

  /**
   * Dispatch an action to update state
   */
  dispatch(action) {
    const {
      type,
      payload
    } = action;
    switch (type) {
      case 'SET_CURRENT_OBJECT':
        this.setState({
          currentObject: payload
        });
        break;
      case 'SET_LOADING':
        this.setState({
          isLoading: payload
        });
        break;
      case 'SET_ERROR':
        this.setState({
          error: payload
        });
        break;
      case 'ADD_TO_HISTORY':
        this.addToHistory(payload);
        break;
      case 'CLEAR_HISTORY':
        this.setState({
          history: []
        });
        break;
      case 'SET_UI_STATE':
        this.setState({
          ui: {
            ...this.state.ui,
            ...payload
          }
        });
        break;
      case 'SET_SETTINGS':
        this.setState({
          settings: {
            ...this.state.settings,
            ...payload
          }
        });
        break;
      case 'SET_API_STATE':
        this.setState({
          api: {
            ...this.state.api,
            ...payload
          }
        });
        break;
      case 'INCREMENT_SEARCH_ATTEMPTS':
        this.setState({
          api: {
            ...this.state.api,
            searchAttempts: this.state.api.searchAttempts + 1
          }
        });
        break;
      case 'RESET_SEARCH_ATTEMPTS':
        this.setState({
          api: {
            ...this.state.api,
            searchAttempts: 0
          }
        });
        break;
      default:
        console.warn('[AppState] Unknown action type:', type);
    }
  }

  /**
   * Add object to history
   */
  addToHistory(objectData) {
    if (!objectData || !objectData.objectNumber) {
      console.warn('[AppState] Invalid object data for history');
      return;
    }

    // Remove existing entry if it exists
    const filteredHistory = this.state.history.filter(item => item.objectNumber !== objectData.objectNumber);

    // Add to beginning of array
    const newHistory = [{
      objectNumber: objectData.objectNumber,
      title: objectData.title,
      artist: objectData.artist,
      date: objectData.date,
      imageUrl: objectData.imageUrl,
      vaCollectionsUrl: objectData.objectUrl,
      timestamp: Date.now()
    }, ...filteredHistory];

    // Limit history size
    if (newHistory.length > this.state.maxHistoryItems) {
      newHistory.splice(this.state.maxHistoryItems);
    }
    this.setState({
      history: newHistory
    });
  }

  /**
   * Remove object from history
   */
  removeFromHistory(objectNumber) {
    const newHistory = this.state.history.filter(item => item.objectNumber !== objectNumber);
    this.setState({
      history: newHistory
    });
  }

  /**
   * Notify subscribers of state changes
   */
  notifySubscribers(changedState) {
    this.subscribers.forEach(({
      callback,
      selector
    }) => {
      try {
        if (selector) {
          // Only notify if the selected part of state changed
          const relevantState = selector(this.state);
          callback(relevantState);
        } else {
          // Notify with full state
          callback({
            ...this.state
          });
        }
      } catch (error) {
        console.error('[AppState] Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = {
      ...target
    };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Get specific state slice
   */
  getCurrentObject() {
    return this.state.currentObject;
  }
  getHistory() {
    return [...this.state.history];
  }
  getSettings() {
    return {
      ...this.state.settings
    };
  }
  getUIState() {
    return {
      ...this.state.ui
    };
  }
  getAPIState() {
    return {
      ...this.state.api
    };
  }
  isLoading() {
    return this.state.isLoading;
  }
  getError() {
    return this.state.error;
  }

  /**
   * Check if state manager is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.state = {
      currentObject: null,
      isLoading: false,
      error: null,
      history: [],
      maxHistoryItems: this.state.maxHistoryItems,
      ui: {
        sidePanelOpen: false,
        historyOverlayOpen: false,
        errorOverlayOpen: false
      },
      settings: {
        searchTerms: [],
        strictSearch: false,
        currentMuseum: 'vanda'
      },
      api: {
        currentSearchTerm: null,
        searchAttempts: 0,
        maxSearchAttempts: 5
      }
    };
    this.notifySubscribers(this.state);
    this.savePersistedState();
  }
}

// Export for use in other modules
if ( true && module.exports) {
  module.exports = AppState;
} else if (typeof window !== 'undefined') {
  window.AppState = AppState;
}

/***/ }),

/***/ 305:
/***/ ((module) => {

/**
 * Component Manager
 * 
 * Orchestrates all UI components and provides:
 * - Central component initialization
 * - Component communication
 * - Event handling coordination
 * - State management integration
 */

class ComponentManager {
  constructor(options = {}) {
    this.components = {};
    this.isInitialized = false;
    this.options = options;

    // State management
    this.appState = null;
    this.stateConnector = null;

    // Bind methods
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.getComponent = this.getComponent.bind(this);
    this.updateObjectDisplay = this.updateObjectDisplay.bind(this);
    this.addToHistory = this.addToHistory.bind(this);
  }

  /**
   * Initialize all components
   */
  async init() {
    try {
      console.log('[ComponentManager] Initializing components...');

      // Initialize state management first
      await this.initStateManagement();

      // Initialize components in order
      await this.initObjectDisplay();
      await this.initHistory();
      await this.initSidePanel();

      // Set up component communication
      this.setupComponentCommunication();
      this.isInitialized = true;
      console.log('[ComponentManager] All components initialized successfully');
    } catch (error) {
      console.error('[ComponentManager] Failed to initialize components:', error);
      throw error;
    }
  }

  /**
   * Initialize state management
   */
  async initStateManagement() {
    try {
      // Create app state
      this.appState = new AppState({
        maxHistoryItems: this.options.maxHistoryItems || 10
      });

      // Initialize state
      await this.appState.init();

      // Create state connector
      this.stateConnector = new StateConnector(this.appState);

      // Make state globally available
      window.appState = this.appState;
      window.stateConnector = this.stateConnector;
      console.log('[ComponentManager] State management initialized');
    } catch (error) {
      console.error('[ComponentManager] Failed to initialize state management:', error);
      throw error;
    }
  }

  /**
   * Initialize Object Display Component
   */
  async initObjectDisplay() {
    try {
      const objectDisplay = new ObjectDisplayComponent(this.options.objectDisplay);

      // Connect to state
      this.stateConnector.connect(objectDisplay, {
        currentObject: stateSelectors.currentObject,
        isLoading: stateSelectors.isLoading,
        error: stateSelectors.error
      });
      await objectDisplay.init();
      this.components.objectDisplay = objectDisplay;
      console.log('[ComponentManager] Object Display Component initialized');
    } catch (error) {
      console.error('[ComponentManager] Failed to initialize Object Display Component:', error);
      throw error;
    }
  }

  /**
   * Initialize History Component
   */
  async initHistory() {
    try {
      const history = new HistoryComponent({
        maxHistoryItems: this.options.maxHistoryItems || 10,
        ...this.options.history
      });

      // Connect to state
      this.stateConnector.connect(history, {
        history: stateSelectors.history,
        historyCount: stateSelectors.historyCount,
        ui: stateSelectors.ui
      });
      await history.init();
      this.components.history = history;
      console.log('[ComponentManager] History Component initialized');
    } catch (error) {
      console.error('[ComponentManager] Failed to initialize History Component:', error);
      throw error;
    }
  }

  /**
   * Initialize Side Panel Component
   */
  async initSidePanel() {
    try {
      const sidePanel = new SidePanelComponent(this.options.sidePanel);

      // Connect to state
      this.stateConnector.connect(sidePanel, {
        settings: stateSelectors.settings,
        searchTerms: stateSelectors.searchTerms,
        ui: stateSelectors.ui
      });
      await sidePanel.init();
      this.components.sidePanel = sidePanel;
      console.log('[ComponentManager] Side Panel Component initialized');
    } catch (error) {
      console.error('[ComponentManager] Failed to initialize Side Panel Component:', error);
      throw error;
    }
  }

  /**
   * Set up communication between components
   */
  setupComponentCommunication() {
    // Set up event listeners for component coordination
    this.addGlobalEventListeners();
  }

  /**
   * Add global event listeners
   */
  addGlobalEventListeners() {
    // Listen for window resize events
    window.addEventListener('resize', this.handleWindowResize.bind(this));

    // Listen for storage changes (handled by state management)
    // No need to duplicate here since AppState handles it
  }

  /**
   * Handle window resize
   */
  handleWindowResize(event) {
    // Notify components of resize
    Object.values(this.components).forEach(component => {
      if (component.handleResize) {
        component.handleResize(event);
      }
    });
  }

  /**
   * Get a specific component
   */
  getComponent(name) {
    return this.components[name];
  }

  /**
   * Update object display with new data
   */
  async updateObjectDisplay(objectData) {
    try {
      // Use state management to update object
      this.appState.dispatch(objectActions.setCurrentObject(objectData));

      // Add to history
      this.appState.dispatch(historyActions.addToHistory(objectData));
      console.log('[ComponentManager] Object display updated via state management');
    } catch (error) {
      console.error('[ComponentManager] Error updating object display:', error);
    }
  }

  /**
   * Add object to history
   */
  async addToHistory(objectData) {
    try {
      this.appState.dispatch(historyActions.addToHistory(objectData));
    } catch (error) {
      console.error('[ComponentManager] Error adding to history:', error);
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.appState.dispatch(loadingActions.startLoading());
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.appState.dispatch(loadingActions.stopLoading());
  }

  /**
   * Show error state
   */
  showError(error = 'An error occurred') {
    this.appState.dispatch(errorActions.setError(error));
    this.appState.dispatch(uiActions.openErrorOverlay());
  }

  /**
   * Hide error state
   */
  hideError() {
    this.appState.dispatch(errorActions.clearError());
    this.appState.dispatch(uiActions.closeErrorOverlay());
  }

  /**
   * Get current object data
   */
  getCurrentObject() {
    return this.appState.getCurrentObject();
  }

  /**
   * Get history data
   */
  getHistory() {
    return this.appState.getHistory();
  }

  /**
   * Clear history
   */
  async clearHistory() {
    this.appState.dispatch(historyActions.clearHistory());
  }

  /**
   * Update search terms display
   */
  updateSearchTerms(searchTerms) {
    this.appState.dispatch(settingsActions.updateSearchTerms(searchTerms));
  }

  /**
   * Open side panel
   */
  openSidePanel() {
    this.appState.dispatch(uiActions.openSidePanel());
  }

  /**
   * Close side panel
   */
  closeSidePanel() {
    this.appState.dispatch(uiActions.closeSidePanel());
  }

  /**
   * Show history
   */
  showHistory() {
    this.appState.dispatch(uiActions.openHistoryOverlay());
  }

  /**
   * Hide history
   */
  hideHistory() {
    this.appState.dispatch(uiActions.closeHistoryOverlay());
  }

  /**
   * Get settings
   */
  getSettings() {
    return this.appState.getSettings();
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    this.appState.dispatch(settingsActions.setSettings(settings));
  }

  /**
   * Get API state
   */
  getAPIState() {
    return this.appState.getAPIState();
  }

  /**
   * Update API state
   */
  updateAPIState(apiState) {
    this.appState.dispatch(apiActions.setAPIState(apiState));
  }

  /**
   * Increment search attempts
   */
  incrementSearchAttempts() {
    this.appState.dispatch(apiActions.incrementSearchAttempts());
  }

  /**
   * Reset search attempts
   */
  resetSearchAttempts() {
    this.appState.dispatch(apiActions.resetSearchAttempts());
  }

  /**
   * Check if component manager is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get all components
   */
  getAllComponents() {
    return {
      ...this.components
    };
  }

  /**
   * Get state manager
   */
  getStateManager() {
    return this.appState;
  }

  /**
   * Get state connector
   */
  getStateConnector() {
    return this.stateConnector;
  }

  /**
   * Dispatch action to state
   */
  dispatch(action) {
    this.appState.dispatch(action);
  }

  /**
   * Get current state
   */
  getState(selector = null) {
    return this.appState.getState(selector);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback, selector = null) {
    return this.appState.subscribe(callback, selector);
  }

  /**
   * Reset application state
   */
  resetState() {
    this.appState.reset();
  }

  /**
   * Destroy all components
   */
  async destroy() {
    try {
      console.log('[ComponentManager] Destroying components...');

      // Disconnect all components from state
      if (this.stateConnector) {
        this.stateConnector.disconnectAll();
      }

      // Destroy components in reverse order
      const componentNames = Object.keys(this.components).reverse();
      for (const name of componentNames) {
        if (this.components[name] && typeof this.components[name].destroy === 'function') {
          await this.components[name].destroy();
        }
      }
      this.components = {};
      this.isInitialized = false;
      console.log('[ComponentManager] All components destroyed');
    } catch (error) {
      console.error('[ComponentManager] Error destroying components:', error);
    }
  }
}

// Export for use in other modules
if ( true && module.exports) {
  module.exports = ComponentManager;
} else if (typeof window !== 'undefined') {
  window.ComponentManager = ComponentManager;
}

/***/ }),

/***/ 308:
/***/ (function() {

var pumkin = window.pumkin = {};
// GLOBAL VARIABLES

// change this depending on the site

(function (window, $, Modernizr) {
  function getTransformValues($element, type) {
    var transformMatrix = $element.css('transform');
    var transformValues = transformMatrix.match(/-?[0-9\.]+/g);
    var scale = transformValues[0];
    var translate = {
      x: transformValues[4] / scale,
      y: transformValues[5] / scale
    };
    if (type === 'scale') {
      return scale;
    } else if (type === 'translate') {
      return translate;
    } else if (type === 'raw') {
      return transformValues;
    }
  }
  function checkKey(e) {
    e = e || window.event;
    return e.keyCode;
  }
  function makePlaceholders(els, activeClass) {
    activeClass = activeClass || 'active';
    $(els).each(function () {
      var $el = $(this);
      var placeholder = $el.data().placeholder;
      $el.val(placeholder);
      if ($.trim($el.val()) === '') {
        $el.val(placeholder).removeClass(activeClass);
      }
      $el.focus(function () {
        if ($el.val() === placeholder) {
          $el.val('').addClass(activeClass);
        }
      }).blur(function () {
        if ($.trim($el.val()) === '') {
          $el.val(placeholder).removeClass(activeClass);
        }
      });
    });
  }
  function svgFallback() {
    $("img[src$='.svg']").each(function () {
      var $el = $(this);
      var origSrc = $el.attr('src');
      var pngSrc = origSrc.replace('.svg', '.png');
      $el.attr('src', pngSrc);
    });
  }
  function normalizeBoxHeights($els) {
    var max = 0;

    // get all the element heights and find the tallest
    $els.each(function () {
      max = Math.max($(this).height(), max);
    });

    // set them all to the height of the tallest
    $els.each(function () {
      $(this).height(max);
    });
  }
  function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  function autoFit($container, $items, margin, doHeightToo, includeLastRow, varyHeight, allSameWidth) {
    console.log('autoFit: ' + $items.length);
    margin = margin || 0;

    // check if we've covered the whole area with tiles
    // if we fall short, expand the tiles to meet the edge of the container
    // currently only works width-ways

    var containerWidth = $container.width() - margin;

    // reset the items to their regular (css-defined) width by removing style attributs
    $items.removeAttr('style');

    // create a master array which will hold the rows
    var allTheRows = [];

    // start a rowWidth variable to measure the combined width of items in each row
    var rowWidth = 0;

    // start an array for items in the current row
    var thisRow = [];

    // now loop through, we create a new array for each row then add it to the master
    $items.each(function () {
      // start adding up the widths until we can't fit another one in
      var $this = $(this);
      rowWidth += parseInt($this.css('width')) + margin;
      if (rowWidth <= containerWidth) {
        // add this item to the row array
        thisRow.push($this);
      } else {
        // add the row to the master array ...
        allTheRows.push(thisRow);

        // ... then start a new row array with this item in it
        thisRow = new Array($this);

        // and reset the rowWidth
        rowWidth = parseInt($this.css('width')) + margin;
      }
      if ($this.is(':last-child') && includeLastRow) {
        // add the final row to the master array ...
        allTheRows.push(thisRow);
      }
    });

    // now loop through the whole array and fit each one
    var numRows = allTheRows.length;
    for (var r = 0; r < numRows; r++) {
      var itemsInRow = allTheRows[r].length;

      // track the row width
      var rowTotalWidth = 0;
      for (var i = 0; i < itemsInRow; i++) {
        rowTotalWidth += parseInt(allTheRows[r][i].css('width')) + margin;
      }

      // what's the amount of remaining width for this row?
      var remainderWidth = containerWidth - rowTotalWidth;

      // width available to add to each item
      var spaceToAdd = remainderWidth / itemsInRow;

      // get the average item width
      var avgItemWidth = rowTotalWidth / itemsInRow;

      // track the new row width, we use to adjust if rounding errors prevent perfect alignment
      var newRowTotalWidth = 0;

      // in progress...
      if (allSameWidth) {
        var theWidth = parseInt(allTheRows[0][0].css('width'));
      }

      // now loop again and add add space according to 
      // the proportion of each item vs. the average item width
      for (i = 0; i < itemsInRow; i++) {
        var itemWidth = parseInt(allTheRows[r][i].css('width'));
        var itemRatio = itemWidth / avgItemWidth;
        var newWidth = allSameWidth ? itemWidth + spaceToAdd : itemWidth + Math.floor(spaceToAdd * itemRatio);
        var newHeight;

        // get the new height from the first element then apply to all the others
        if (r === 0 && i === 0) {
          var itemHeight = parseInt(allTheRows[r][i].css('height'));

          // set the new height to keep proportions (if option is true)
          newHeight = doHeightToo ? Math.floor(newWidth * (itemHeight / itemWidth)) : itemHeight;
        }
        if (varyHeight) {
          allTheRows[r][i].css({
            'width': newWidth
          });
        } else {
          allTheRows[r][i].css({
            'width': newWidth,
            'height': newHeight
          });
        }
        newRowTotalWidth += newWidth + margin;
      }

      // add or subtract any rounding error difference
      var difference = containerWidth - newRowTotalWidth;
      allTheRows[r][itemsInRow - 1].css('width', parseInt(allTheRows[r][itemsInRow - 1].css('width')) + difference);
    }
  }
  function intelliLoad($imgs, src, revealOnLoad) {
    // check if we have a library available (desandro's imagesLoaded) to listen for image load
    // if not, don't do revealOnLoad
    revealOnLoad = typeof imagesLoaded === "function" ? revealOnLoad : false;
    $imgs.each(function () {
      var $img = $(this);
      // under normal usage there'd be an image tag but no src attr
      // image source is held in data-src
      // can be overridden by passing src param if required
      var src = src || $img.data('src');
      if (revealOnLoad) {
        $img.css({
          'opacity': 0
        });
      }
      if (!$img.attr('src')) {
        $img.attr('src', src);
        console.log('INTELLILOAD: is image?' + $img.is('img'));
        if (revealOnLoad && $img.is('img')) {
          console.log('INTELLILOAD: revlealOnLoad: ' + src);
          $img.imagesLoaded().done(function (instance, image) {
            console.log('INTELLILOAD: imagesLoaded: ' + image.attr('src'));
            image.css({
              'opacity': 1
            }); // no animation via js - add a transition in css if you want
          });
        }
      }
    });
  }
  function defineDeviceVariables() {
    var deviceVariables;
    deviceVariables = {
      isMobile: $('#mobileTester').css('visibility') === 'visible' ? true : false,
      isTablet: $('#tabletTester').css('visibility') === 'visible' ? true : false,
      isTouch: Modernizr.touch ? true : false
    };
    deviceVariables.isDevice = deviceVariables.isMobile || deviceVariables.isTablet ? true : false;
    return deviceVariables;
  }
  function browserDetection() {
    var browser = {};
    browser.isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    browser.isExplorer = navigator.userAgent.indexOf('MSIE') > -1;
    browser.isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    browser.isSafari = navigator.userAgent.indexOf('Safari') > -1;
    browser.isOpera = navigator.userAgent.indexOf('Presto') > -1;
    if (browser.isChrome && browser.isSafari) {
      browser.isSafari = false;
    }
    return browser;
  }
  pumkin = {
    getTransformValues: getTransformValues,
    checkKey: checkKey,
    svgFallback: svgFallback,
    normalizeBoxHeights: normalizeBoxHeights,
    randomNum: randomNum,
    autoFit: autoFit,
    defineDeviceVariables: defineDeviceVariables,
    browserDetection: browserDetection,
    makePlaceholders: makePlaceholders,
    intelliLoad: intelliLoad
  };
})(this, this.jQuery, this.Modernizr);

/***/ }),

/***/ 607:
/***/ (function() {

;
(function (window, $, Modernizr) {
  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};
  function initGlobal() {
    var gv;
    gv = window.gv = {
      $window: $(window),
      $document: $(document),
      $html: $('html'),
      $body: $('body'),
      WIDTH: $(window).width(),
      HEIGHT: $(window).height(),
      deviceVariables: pumkin.defineDeviceVariables(),
      browser: pumkin.browserDetection(),
      // site specific
      $wrapper: $('#wrapper')
    };
    console.log('initGlobal');
  }

  // EXPORT
  SITE.initGlobal = initGlobal;
})(this, this.jQuery, this.Modernizr);

/***/ }),

/***/ 711:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* unused harmony exports ActionTypes, objectActions, loadingActions, errorActions, historyActions, uiActions, settingsActions, apiActions, compositeActions, createBatchAction, actions */
/* module decorator */ module = __webpack_require__.hmd(module);
/**
 * Action Creators
 * 
 * Provides a clean interface for creating actions that update the application state.
 * Makes state updates more predictable and easier to debug.
 */

// Action Types
const ActionTypes = {
  // Object actions
  SET_CURRENT_OBJECT: 'SET_CURRENT_OBJECT',
  CLEAR_CURRENT_OBJECT: 'CLEAR_CURRENT_OBJECT',
  // Loading actions
  SET_LOADING: 'SET_LOADING',
  START_LOADING: 'START_LOADING',
  STOP_LOADING: 'STOP_LOADING',
  // Error actions
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  // History actions
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  REMOVE_FROM_HISTORY: 'REMOVE_FROM_HISTORY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  // UI actions
  SET_UI_STATE: 'SET_UI_STATE',
  OPEN_SIDE_PANEL: 'OPEN_SIDE_PANEL',
  CLOSE_SIDE_PANEL: 'CLOSE_SIDE_PANEL',
  OPEN_HISTORY_OVERLAY: 'OPEN_HISTORY_OVERLAY',
  CLOSE_HISTORY_OVERLAY: 'CLOSE_HISTORY_OVERLAY',
  OPEN_ERROR_OVERLAY: 'OPEN_ERROR_OVERLAY',
  CLOSE_ERROR_OVERLAY: 'CLOSE_ERROR_OVERLAY',
  // Settings actions
  SET_SETTINGS: 'SET_SETTINGS',
  UPDATE_SEARCH_TERMS: 'UPDATE_SEARCH_TERMS',
  SET_STRICT_SEARCH: 'SET_STRICT_SEARCH',
  SET_CURRENT_MUSEUM: 'SET_CURRENT_MUSEUM',
  // API actions
  SET_API_STATE: 'SET_API_STATE',
  SET_CURRENT_SEARCH_TERM: 'SET_CURRENT_SEARCH_TERM',
  INCREMENT_SEARCH_ATTEMPTS: 'INCREMENT_SEARCH_ATTEMPTS',
  RESET_SEARCH_ATTEMPTS: 'RESET_SEARCH_ATTEMPTS',
  // Batch actions
  BATCH_UPDATE: 'BATCH_UPDATE'
};

// Object Actions
const objectActions = {
  setCurrentObject: objectData => ({
    type: ActionTypes.SET_CURRENT_OBJECT,
    payload: objectData
  }),
  clearCurrentObject: () => ({
    type: ActionTypes.CLEAR_CURRENT_OBJECT,
    payload: null
  })
};

// Loading Actions
const loadingActions = {
  setLoading: isLoading => ({
    type: ActionTypes.SET_LOADING,
    payload: isLoading
  }),
  startLoading: () => ({
    type: ActionTypes.START_LOADING,
    payload: true
  }),
  stopLoading: () => ({
    type: ActionTypes.STOP_LOADING,
    payload: false
  })
};

// Error Actions
const errorActions = {
  setError: error => ({
    type: ActionTypes.SET_ERROR,
    payload: error
  }),
  clearError: () => ({
    type: ActionTypes.CLEAR_ERROR,
    payload: null
  })
};

// History Actions
const historyActions = {
  addToHistory: objectData => ({
    type: ActionTypes.ADD_TO_HISTORY,
    payload: objectData
  }),
  removeFromHistory: objectNumber => ({
    type: ActionTypes.REMOVE_FROM_HISTORY,
    payload: objectNumber
  }),
  clearHistory: () => ({
    type: ActionTypes.CLEAR_HISTORY,
    payload: null
  })
};

// UI Actions
const uiActions = {
  setUIState: uiState => ({
    type: ActionTypes.SET_UI_STATE,
    payload: uiState
  }),
  openSidePanel: () => ({
    type: ActionTypes.OPEN_SIDE_PANEL,
    payload: {
      sidePanelOpen: true
    }
  }),
  closeSidePanel: () => ({
    type: ActionTypes.CLOSE_SIDE_PANEL,
    payload: {
      sidePanelOpen: false
    }
  }),
  openHistoryOverlay: () => ({
    type: ActionTypes.OPEN_HISTORY_OVERLAY,
    payload: {
      historyOverlayOpen: true
    }
  }),
  closeHistoryOverlay: () => ({
    type: ActionTypes.CLOSE_HISTORY_OVERLAY,
    payload: {
      historyOverlayOpen: false
    }
  }),
  openErrorOverlay: () => ({
    type: ActionTypes.OPEN_ERROR_OVERLAY,
    payload: {
      errorOverlayOpen: true
    }
  }),
  closeErrorOverlay: () => ({
    type: ActionTypes.CLOSE_ERROR_OVERLAY,
    payload: {
      errorOverlayOpen: false
    }
  })
};

// Settings Actions
const settingsActions = {
  setSettings: settings => ({
    type: ActionTypes.SET_SETTINGS,
    payload: settings
  }),
  updateSearchTerms: searchTerms => ({
    type: ActionTypes.UPDATE_SEARCH_TERMS,
    payload: {
      searchTerms
    }
  }),
  setStrictSearch: strictSearch => ({
    type: ActionTypes.SET_STRICT_SEARCH,
    payload: {
      strictSearch
    }
  }),
  setCurrentMuseum: currentMuseum => ({
    type: ActionTypes.SET_CURRENT_MUSEUM,
    payload: {
      currentMuseum
    }
  })
};

// API Actions
const apiActions = {
  setAPIState: apiState => ({
    type: ActionTypes.SET_API_STATE,
    payload: apiState
  }),
  setCurrentSearchTerm: searchTerm => ({
    type: ActionTypes.SET_CURRENT_SEARCH_TERM,
    payload: {
      currentSearchTerm: searchTerm
    }
  }),
  incrementSearchAttempts: () => ({
    type: ActionTypes.INCREMENT_SEARCH_ATTEMPTS,
    payload: null
  }),
  resetSearchAttempts: () => ({
    type: ActionTypes.RESET_SEARCH_ATTEMPTS,
    payload: null
  })
};

// Composite Actions (combine multiple actions)
const compositeActions = {
  // Load object and update state
  loadObject: objectData => [loadingActions.startLoading(), objectActions.setCurrentObject(objectData), historyActions.addToHistory(objectData), loadingActions.stopLoading(), errorActions.clearError()],
  // Show error state
  showError: error => [errorActions.setError(error), loadingActions.stopLoading(), uiActions.openErrorOverlay()],
  // Clear error state
  clearError: () => [errorActions.clearError(), uiActions.closeErrorOverlay()],
  // Update search settings
  updateSearchSettings: (searchTerms, strictSearch) => [settingsActions.updateSearchTerms(searchTerms), settingsActions.setStrictSearch(strictSearch), apiActions.resetSearchAttempts()],
  // Reset application state
  resetApp: () => [objectActions.clearCurrentObject(), loadingActions.stopLoading(), errorActions.clearError(), historyActions.clearHistory(), uiActions.setUIState({
    sidePanelOpen: false,
    historyOverlayOpen: false,
    errorOverlayOpen: false
  }), apiActions.resetSearchAttempts()]
};

// Helper function to create batch actions
const createBatchAction = actions => ({
  type: ActionTypes.BATCH_UPDATE,
  payload: actions
});

// Export all actions
const actions = {
  ...objectActions,
  ...loadingActions,
  ...errorActions,
  ...historyActions,
  ...uiActions,
  ...settingsActions,
  ...apiActions,
  ...compositeActions
};

// Export for use in other modules
if ( true && module.exports) {
  module.exports = {
    ActionTypes,
    actions,
    objectActions,
    loadingActions,
    errorActions,
    historyActions,
    uiActions,
    settingsActions,
    apiActions,
    compositeActions,
    createBatchAction
  };
} else if (typeof window !== 'undefined') {
  window.ActionTypes = ActionTypes;
  window.actions = actions;
  window.objectActions = objectActions;
  window.loadingActions = loadingActions;
  window.errorActions = errorActions;
  window.historyActions = historyActions;
  window.uiActions = uiActions;
  window.settingsActions = settingsActions;
  window.apiActions = apiActions;
  window.compositeActions = compositeActions;
  window.createBatchAction = createBatchAction;
}

/***/ }),

/***/ 760:
/***/ (function() {

;
(function (window, $) {
  var pumkin = window.pumkin = window.pumkin || {};
  var SITE = window.SITE = window.SITE || {};

  // ON DOC READY
  $(function () {
    console.log("=== DOCUMENT READY HANDLER EXECUTED ===");
    SITE.initGlobal();
    SITE.initMain();

    // Start the V&A API functionality
    SITE.start();
  });
})(this, this.jQuery);

/***/ }),

/***/ 869:
/***/ ((module) => {

/**
 * Object Display Component
 * 
 * Handles the display of museum objects and their details.
 * Now integrated with state management for reactive updates.
 */

class ObjectDisplayComponent extends BaseComponent {
  constructor(options = {}) {
    super('ObjectDisplayComponent', options);
    this.currentObject = null;
    this.isLoading = false;
    this.error = null;

    // Bind methods
    this.onCurrentObjectUpdate = this.onCurrentObjectUpdate.bind(this);
    this.onLoadingUpdate = this.onLoadingUpdate.bind(this);
    this.onErrorUpdate = this.onErrorUpdate.bind(this);
  }

  /**
   * Initialize the component
   */
  async init() {
    try {
      console.log('[ObjectDisplayComponent] Initializing...');

      // Set up event listeners
      this.setupEventListeners();

      // Initial UI setup
      this.setupInitialUI();
      console.log('[ObjectDisplayComponent] Initialized successfully');
    } catch (error) {
      console.error('[ObjectDisplayComponent] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Handle image loading
    this.on('click', '#image', this.handleImageClick.bind(this));

    // Handle Pinterest button
    this.on('click', '#pinterest-button', this.handlePinterestClick.bind(this));

    // Handle Twitter button
    this.on('click', '#twitter-button', this.handleTwitterClick.bind(this));

    // Handle page link
    this.on('click', '#page-link', this.handlePageLinkClick.bind(this));
  }

  /**
   * Set up initial UI state
   */
  setupInitialUI() {
    // Show loading state initially
    this.showLoading();
  }

  /**
   * Handle current object state updates
   */
  onCurrentObjectUpdate(objectData) {
    console.log('[ObjectDisplayComponent] Object data updated:', objectData);
    if (objectData) {
      this.currentObject = objectData;
      this.updateDisplay(objectData);
    } else {
      this.currentObject = null;
      this.clearDisplay();
    }
  }

  /**
   * Handle loading state updates
   */
  onLoadingUpdate(isLoading) {
    console.log('[ObjectDisplayComponent] Loading state updated:', isLoading);
    this.isLoading = isLoading;
    if (isLoading) {
      this.showLoading();
    } else {
      this.hideLoading();
    }
  }

  /**
   * Handle error state updates
   */
  onErrorUpdate(error) {
    console.log('[ObjectDisplayComponent] Error state updated:', error);
    this.error = error;
    if (error) {
      this.showError(error);
    } else {
      this.hideError();
    }
  }

  /**
   * Update the display with object data
   */
  updateDisplay(objectData) {
    try {
      console.log('[ObjectDisplayComponent] Updating display with object data');

      // Handle title length for CSS classes
      this.updateTitleClasses(objectData.title);

      // Update basic information
      this.updateBasicInfo(objectData);

      // Update image
      this.updateImage(objectData);

      // Update links
      this.updateLinks(objectData);

      // Update descriptions
      this.updateDescriptions(objectData);

      // Update technical information
      this.updateTechnicalInfo(objectData);

      // Hide loading state
      this.hideLoading();
      console.log('[ObjectDisplayComponent] Display updated successfully');
    } catch (error) {
      console.error('[ObjectDisplayComponent] Error updating display:', error);
      this.showError('Failed to update display');
    }
  }

  /**
   * Update title CSS classes based on length
   */
  updateTitleClasses(title) {
    const $title = $("#title");
    const $pieceDate = $("#piece-date");
    if (title.length > 42) {
      $title.addClass("reduced");
      $pieceDate.addClass("reduced");
    } else {
      $title.removeClass("reduced");
      $pieceDate.removeClass("reduced");
    }
  }

  /**
   * Update basic object information
   */
  updateBasicInfo(objectData) {
    $("#creator-name").text(objectData.artist || '');
    $("#dates-alive").text(objectData.datesAlive || '');
    $("#title").html(objectData.title || '');
    if (objectData.date && objectData.date !== "") {
      $("#piece-date").text("(" + objectData.date + ")");
    } else {
      $("#piece-date").text("");
    }
    $("#place").html(objectData.place || '');
  }

  /**
   * Update object image
   */
  updateImage(objectData) {
    if (objectData.imageUrl && objectData.imageUrl !== "") {
      $("#image").attr("src", objectData.imageUrl);
    } else {
      // No image available - show placeholder
      const $imageContainer = $('.object-image-wrapper');
      $imageContainer.html(`
                <div class="image-placeholder">
                    <p>Image not available</p>
                    <p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p>
                </div>
            `);
    }
  }

  /**
   * Update object links
   */
  updateLinks(objectData) {
    // Update page link
    $("#page-link").attr("href", objectData.objectUrl || '#');

    // Update Pinterest URL
    if (objectData.imageUrl && objectData.title) {
      let pinterestUrl = "https://www.pinterest.com/pin/create/button/";
      pinterestUrl += "?url=" + encodeURIComponent(objectData.objectUrl || '');
      pinterestUrl += "&media=" + encodeURIComponent(objectData.imageUrl);
      pinterestUrl += "&description=" + encodeURIComponent(objectData.title);
      if (objectData.date !== "") {
        pinterestUrl += encodeURIComponent(" (" + objectData.place + ", " + objectData.date + ")");
      }
      pinterestUrl += encodeURIComponent(", V%26A Collection");
      $("#pinterest-button").attr("href", pinterestUrl);
    }

    // Update Twitter URL
    if (objectData.title) {
      let twitterUrl = "https://twitter.com/intent/tweet";
      twitterUrl += "?text=" + encodeURIComponent(objectData.title);
      if (objectData.date !== "") {
        twitterUrl += encodeURIComponent(" (" + objectData.place + ", " + objectData.date + ")");
      }
      twitterUrl += encodeURIComponent(", V&A Collection ");
      twitterUrl += encodeURIComponent(objectData.objectUrl || '');
      $("#twitter-button").attr("href", twitterUrl);
    }
  }

  /**
   * Update object descriptions
   */
  updateDescriptions(objectData) {
    if (objectData.description && objectData.description !== "") {
      $("#object-description").html("<p>" + objectData.description + "</p>");
    } else {
      $("#object-description").html("");
    }
    if (objectData.context && objectData.context !== "") {
      $("#object-context").html("<p>" + objectData.context + "</p>");
    } else {
      $("#object-context").html("");
    }
  }

  /**
   * Update technical information
   */
  updateTechnicalInfo(objectData) {
    const fields = [{
      selector: "#physical-description",
      value: objectData.physicalDescription
    }, {
      selector: "#tech-info-place",
      value: objectData.place
    }, {
      selector: "#tech-info-piece-date",
      value: objectData.date
    }, {
      selector: "#tech-info-creator-name",
      value: objectData.artist
    }, {
      selector: "#tech-info-materials",
      value: objectData.materials
    }, {
      selector: "#dimensions",
      value: objectData.dimensions
    }, {
      selector: "#museum-location",
      value: objectData.museumLocation
    }, {
      selector: "#museum-number",
      value: objectData.objectNumber
    }];
    fields.forEach(field => {
      if (field.value && field.value !== "") {
        $(field.selector).text(field.value);
        $(field.selector).closest('section').show();
      } else {
        $(field.selector).closest('section').hide();
      }
    });
  }

  /**
   * Clear the display
   */
  clearDisplay() {
    console.log('[ObjectDisplayComponent] Clearing display');

    // Clear all text fields
    $("#creator-name, #dates-alive, #title, #piece-date, #place").text("");

    // Clear image
    $("#image").attr("src", "");

    // Clear descriptions
    $("#object-description, #object-context").html("");

    // Hide all technical info sections
    $("section").hide();

    // Clear links
    $("#page-link, #pinterest-button, #twitter-button").attr("href", "#");
  }

  /**
   * Show loading state
   */
  showLoading() {
    console.log('[ObjectDisplayComponent] Showing loading state');

    // Show loading indicator
    $('.object-display').addClass('loading');

    // You could add a loading spinner here if needed
    // $('.object-display').append('<div class="loading-spinner">Loading...</div>');
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    console.log('[ObjectDisplayComponent] Hiding loading state');

    // Hide loading indicator
    $('.object-display').removeClass('loading');

    // Remove loading spinner if it exists
    $('.loading-spinner').remove();
  }

  /**
   * Show error state
   */
  showError(error) {
    console.log('[ObjectDisplayComponent] Showing error:', error);

    // Show error message
    $('.object-display').addClass('error');

    // You could add an error message display here
    // $('.object-display').append(`<div class="error-message">${error}</div>`);
  }

  /**
   * Hide error state
   */
  hideError() {
    console.log('[ObjectDisplayComponent] Hiding error state');

    // Hide error indicator
    $('.object-display').removeClass('error');

    // Remove error message if it exists
    $('.error-message').remove();
  }

  /**
   * Handle image click
   */
  handleImageClick(event) {
    console.log('[ObjectDisplayComponent] Image clicked');

    // Open image in new tab if it exists
    const imageUrl = $(event.target).attr('src');
    if (imageUrl && imageUrl !== '') {
      window.open(imageUrl, '_blank');
    }
  }

  /**
   * Handle Pinterest button click
   */
  handlePinterestClick(event) {
    console.log('[ObjectDisplayComponent] Pinterest button clicked');
    // Pinterest will handle the redirect automatically
  }

  /**
   * Handle Twitter button click
   */
  handleTwitterClick(event) {
    console.log('[ObjectDisplayComponent] Twitter button clicked');
    // Twitter will handle the redirect automatically
  }

  /**
   * Handle page link click
   */
  handlePageLinkClick(event) {
    console.log('[ObjectDisplayComponent] Page link clicked');
    // Link will open in new tab automatically
  }

  /**
   * Get current object data
   */
  getCurrentObject() {
    return this.currentObject;
  }

  /**
   * Check if currently loading
   */
  isLoading() {
    return this.isLoading;
  }

  /**
   * Get current error
   */
  getError() {
    return this.error;
  }

  /**
   * Handle window resize
   */
  handleResize(event) {
    // Handle responsive behavior if needed
    console.log('[ObjectDisplayComponent] Window resized');
  }
}

// Export for use in other modules
if ( true && module.exports) {
  module.exports = ObjectDisplayComponent;
} else if (typeof window !== 'undefined') {
  window.ObjectDisplayComponent = ObjectDisplayComponent;
}

/***/ }),

/***/ 886:
/***/ (function() {

/**
 * Museum API Abstraction Layer
 * 
 * This module provides a unified interface for different museum APIs.
 * It allows easy switching between V&A, Smithsonian, Rijksmuseum, etc.
 */

(function (window, $) {
  'use strict';

  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};

  /**
   * Base Museum API Interface
   * All museum API implementations should extend this class
   */
  class MuseumApi {
    constructor(config) {
      this.config = config || {};
      this.searchCount = 0;
      this.maxSearchCounts = 5;
    }

    /**
     * Initialize the API
     * @param {Object} options - Configuration options
     * @returns {Promise} - Promise that resolves when initialization is complete
     */
    async initialize(options) {
      throw new Error('initialize() must be implemented by subclass');
    }

    /**
     * Make a search request
     * @param {Object} params - Search parameters
     * @returns {Promise} - Promise that resolves with search results
     */
    async search(params) {
      throw new Error('search() must be implemented by subclass');
    }

    /**
     * Get a specific object by ID
     * @param {string} objectId - The object's unique identifier
     * @returns {Promise} - Promise that resolves with object data
     */
    async getObject(objectId) {
      throw new Error('getObject() must be implemented by subclass');
    }

    /**
     * Process and normalize object data
     * @param {Object} rawData - Raw data from the API
     * @returns {Object} - Normalized object data
     */
    processObjectData(rawData) {
      throw new Error('processObjectData() must be implemented by subclass');
    }

    /**
     * Build image URL for an object
     * @param {string} imageId - Image identifier
     * @returns {string} - Complete image URL
     */
    buildImageUrl(imageId) {
      throw new Error('buildImageUrl() must be implemented by subclass');
    }

    /**
     * Build object URL for external links
     * @param {string} objectId - Object identifier
     * @returns {string} - Complete object URL
     */
    buildObjectUrl(objectId) {
      throw new Error('buildObjectUrl() must be implemented by subclass');
    }

    /**
     * Get search terms for this museum
     * @returns {Array} - Array of search terms
     */
    getSearchTerms() {
      throw new Error('getSearchTerms() must be implemented by subclass');
    }

    /**
     * Choose a random search term
     * @returns {string} - Selected search term
     */
    chooseSearchTerm() {
      const searchTerms = this.getSearchTerms();
      const chosenTerm = searchTerms[pumkin.randomNum(0, searchTerms.length)];
      console.log("Chosen search term: " + chosenTerm + " from " + searchTerms.length + " available terms");
      return chosenTerm;
    }

    /**
     * Check if we've exceeded maximum search attempts
     * @returns {boolean} - True if max attempts reached
     */
    hasExceededMaxAttempts() {
      return this.searchCount >= this.maxSearchCounts;
    }

    /**
     * Increment search count
     */
    incrementSearchCount() {
      this.searchCount++;
    }

    /**
     * Reset search count
     */
    resetSearchCount() {
      this.searchCount = 0;
    }
  }

  /**
   * V&A Museum API Implementation
   */
  class VandAApi extends MuseumApi {
    constructor() {
      super();
      this.baseUrl = "https://api.vam.ac.uk/v2/objects/search";
      this.mediaUrl = "https://media.vam.ac.uk/media/thira/collection_images/";
      this.collectionsUrl = "https://collections.vam.ac.uk/item/";
      this.defaultSearchTerms = ["Architecture", "Asia", "British Galleries", "Ceramics", "Childhood", "Contemporary", "Fashion", "Jewellery", "Furniture", "Glass", "Metalwork", "Paintings", "Drawings", "Photography", "Prints", "Books", "Sculpture", "Textiles", "Theatre"];
      this.searchTerms = this.defaultSearchTerms;
      this.strictSearch = false;
    }

    /**
     * Initialize the V&A API with user settings
     */
    async initialize() {
      return new Promise(resolve => {
        if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
          chrome.storage.sync.get({
            userSearchTerms: "",
            strictSearch: "fuzzy"
          }, items => {
            if (items.userSearchTerms.length > 0) {
              console.log("using user search terms: " + items.userSearchTerms);
              this.searchTerms = items.userSearchTerms.replace(/ /g, "+").split(",");
            } else {
              console.log("using default search terms: " + this.defaultSearchTerms);
              this.searchTerms = this.defaultSearchTerms;
            }
            console.log("strictSearch setting = " + items.strictSearch);
            this.strictSearch = items.strictSearch === "strict";

            // Display search terms in the side panel
            const searchTermsDisplay = this.searchTerms.join(", ");
            $("#search-terms").text(searchTermsDisplay);
            resolve();
          });
        } else {
          console.log("Running as standalone page, using default search terms");
          this.searchTerms = this.defaultSearchTerms;

          // Display search terms in the side panel
          const searchTermsDisplay = this.searchTerms.join(", ");
          $("#search-terms").text(searchTermsDisplay);
          resolve();
        }
      });
    }

    /**
     * Make a search request to V&A API
     */
    async search(params = {}) {
      const {
        searchTerm = null,
        offset = null,
        limit = "1",
        withImages = "1",
        withDescription = "1",
        after = null,
        random = "0",
        hasImage = "1"
      } = params;
      this.incrementSearchCount();
      if (this.hasExceededMaxAttempts()) {
        throw new Error("Maximum number of search attempts reached");
      }
      return new Promise((resolve, reject) => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          console.log("Sending message to background script...");
          chrome.runtime.sendMessage({
            action: 'makeVaRequest',
            params: {
              searchTerm: searchTerm,
              offset: offset,
              limit: limit,
              withImages: withImages,
              withDescription: withDescription,
              after: after,
              random: random,
              hasImage: hasImage
            }
          }, response => {
            console.log("Received response from background script:", response);
            if (response && response.success) {
              console.log("API request successful");
              resolve(response.data);
            } else {
              console.log("API request failed:", response ? response.error : "No response");
              reject(new Error(response ? response.error : "API request failed"));
            }
          });
        } else {
          console.log("Running as standalone page - API requests will fail due to CORS");
          reject(new Error("CORS not supported in standalone mode"));
        }
      });
    }

    /**
     * Get a specific object by system number
     */
    async getObject(systemNumber) {
      return this.search({
        systemNumber: systemNumber
      });
    }

    /**
     * Process and normalize V&A object data
     */
    processObjectData(rawData) {
      if (!rawData.records || rawData.records.length === 0) {
        throw new Error("No object data found");
      }
      const objectInfo = rawData.records[0];
      const imageId = objectInfo._primaryImageId;

      // Handle artist dates
      let datesAlive = "";
      if (objectInfo._primaryMaker && objectInfo._primaryMaker.birthYear) {
        const birthYear = objectInfo._primaryMaker.birthYear;
        const deathYear = objectInfo._primaryMaker.deathYear;
        if (birthYear && deathYear) {
          datesAlive = "(" + birthYear + " - " + deathYear + ")";
        } else if (birthYear) {
          datesAlive = "(Born " + birthYear + ")";
        }
      }

      // Clean up title
      let title = objectInfo._primaryTitle != "" ? objectInfo._primaryTitle : objectInfo.objectType;
      title = title.replace(/\^/, "").replace(/\<i\>/g, "").replace(/\<\\i\>/g, "").replace(/\<b\>/g, "").replace(/\<\\b\>/g, "");

      // Create description from available data
      const descriptionParts = [];
      if (title && title !== objectInfo.objectType) {
        descriptionParts.push(title);
      }
      if (objectInfo._primaryDate) {
        descriptionParts.push("Dated " + objectInfo._primaryDate);
      }
      if (objectInfo._primaryPlace) {
        descriptionParts.push("from " + objectInfo._primaryPlace);
      }
      if (objectInfo._primaryMaker && objectInfo._primaryMaker.name && objectInfo._primaryMaker.name !== "Unknown") {
        descriptionParts.push("by " + objectInfo._primaryMaker.name);
      }
      const description = descriptionParts.length > 0 ? descriptionParts.join(", ") + "." : "A " + objectInfo.objectType + " from the V&A collection.";
      return {
        // Basic info
        title: title,
        objectType: objectInfo.objectType,
        date: objectInfo._primaryDate || "",
        artist: objectInfo._primaryMaker && objectInfo._primaryMaker.name ? objectInfo._primaryMaker.name : "",
        datesAlive: datesAlive,
        place: objectInfo._primaryPlace || "",
        // Identifiers
        systemNumber: objectInfo.systemNumber,
        accessionNumber: objectInfo.accessionNumber,
        imageId: imageId,
        // URLs
        imageUrl: this.buildImageUrl(imageId),
        objectUrl: this.buildObjectUrl(objectInfo.systemNumber),
        // Descriptions
        description: description,
        sideCaption: "<strong>" + title + " " + (objectInfo._primaryDate || "") + "</strong>" + " &mdash; " + (objectInfo._primaryMaker && objectInfo._primaryMaker.name ? objectInfo._primaryMaker.name : "") + " " + datesAlive,
        // Museum info
        museumLocation: objectInfo._currentLocation ? objectInfo._currentLocation.displayName : "",
        // Raw data for additional processing
        rawData: objectInfo
      };
    }

    /**
     * Build V&A image URL using IIIF format
     */
    buildImageUrl(imageId) {
      if (imageId && imageId !== null && imageId !== "") {
        return "https://framemark.vam.ac.uk/collections/" + imageId + "/full/1000,/0/default.jpg";
      }
      return "";
    }

    /**
     * Build V&A object URL
     */
    buildObjectUrl(systemNumber) {
      return this.collectionsUrl + systemNumber + "/" + systemNumber;
    }

    /**
     * Get search terms for V&A
     */
    getSearchTerms() {
      return this.searchTerms;
    }

    /**
     * Choose a random search term for V&A
     */
    chooseSearchTerm() {
      return this.searchTerms[pumkin.randomNum(0, this.searchTerms.length)];
    }
  }

  /**
   * Museum API Factory
   * Creates and returns the appropriate API implementation
   */
  class MuseumApiFactory {
    static create(museumType = 'vanda') {
      switch (museumType.toLowerCase()) {
        case 'vanda':
        case 'v&a':
        case 'victoria':
          return new VandAApi();
        // Future implementations:
        // case 'smithsonian':
        //     return new SmithsonianApi();
        // case 'rijksmuseum':
        //     return new RijksmuseumApi();
        default:
          throw new Error(`Unknown museum type: ${museumType}`);
      }
    }
  }

  // Export to global scope
  SITE.MuseumApi = MuseumApi;
  SITE.VandAApi = VandAApi;
  SITE.MuseumApiFactory = MuseumApiFactory;
})(this, this.jQuery);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/harmony module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.hmd = (module) => {
/******/ 			module = Object.create(module);
/******/ 			if (!module.children) module.children = [];
/******/ 			Object.defineProperty(module, 'exports', {
/******/ 				enumerable: true,
/******/ 				set: () => {
/******/ 					throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
/******/ 				}
/******/ 			});
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__(308);
/******/ 	__webpack_require__(607);
/******/ 	__webpack_require__(162);
/******/ 	__webpack_require__(886);
/******/ 	__webpack_require__(262);
/******/ 	__webpack_require__(711);
/******/ 	__webpack_require__(158);
/******/ 	__webpack_require__(127);
/******/ 	__webpack_require__(869);
/******/ 	__webpack_require__(228);
/******/ 	__webpack_require__(169);
/******/ 	__webpack_require__(305);
/******/ 	__webpack_require__(96);
/******/ 	var __webpack_exports__ = __webpack_require__(760);
/******/ 	
/******/ })()
;