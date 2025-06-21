/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 96:
/***/ (() => {

/**
 * V&A API - Refactored Version with Component System
 * 
 * This version uses the modular component system for better maintainability
 * and extensibility. It replaces direct DOM manipulation with component-based
 * UI updates.
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

    // Update the UI using the component system
    await updateUIWithComponentSystem(objectData);

    // Save to history if this is a final object (not a search step)
    if (expectResponse !== 0 && expectResponse !== 1) {
      await saveToHistoryWithComponentSystem(objectData);
    }
  }

  /**
   * Update the UI using the component system
   */
  async function updateUIWithComponentSystem(objectData) {
    console.log("Updating UI with component system:", objectData);
    try {
      // Use the component manager to update the object display
      if (window.componentManager) {
        await window.componentManager.updateObjectDisplay(objectData);
      } else {
        // Fallback to direct DOM manipulation if component system not available
        console.warn("Component system not available, using fallback");
        updateUIFallback(objectData);
      }
      console.log("UI updated successfully with component system");
    } catch (error) {
      console.error("Error updating UI with component system:", error);
      // Fallback to direct DOM manipulation
      updateUIFallback(objectData);
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
   * Save to history using the component system
   */
  async function saveToHistoryWithComponentSystem(objectData) {
    try {
      if (window.componentManager) {
        await window.componentManager.addToHistory(objectData);
      } else {
        // Fallback to direct history management
        console.warn("Component system not available, using fallback history");
        saveToHistoryFallback(objectData);
      }
    } catch (error) {
      console.error("Error saving to history with component system:", error);
      // Fallback to direct history management
      saveToHistoryFallback(objectData);
    }
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

  // Public API
  // ----------------------------------------------------

  // Expose functions to global scope
  SITE.start = start;
  SITE.makeVaRequest = makeVaRequest;
  SITE.processResponse = processResponse;

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

/***/ 305:
/***/ ((module) => {

/**
 * Component Manager
 * 
 * Orchestrates all UI components and provides:
 * - Central component initialization
 * - Component communication
 * - Event handling coordination
 * - State management
 */

class ComponentManager {
  constructor(options = {}) {
    this.components = {};
    this.isInitialized = false;
    this.options = options;

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
   * Initialize Object Display Component
   */
  async initObjectDisplay() {
    try {
      const objectDisplay = new ObjectDisplayComponent(this.options.objectDisplay);
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
      await history.init();
      await history.loadHistory();
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

    // Listen for storage changes
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
    }
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
   * Handle storage changes
   */
  handleStorageChange(changes, namespace) {
    // Update search terms in side panel when they change
    if (changes.searchTerms && this.components.sidePanel) {
      this.components.sidePanel.updateSearchTerms(changes.searchTerms.newValue);
    }
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
      if (this.components.objectDisplay) {
        this.components.objectDisplay.updateDisplay(objectData);

        // Automatically add to history
        if (this.components.history) {
          await this.components.history.addToHistory(objectData);
        }
        console.log('[ComponentManager] Object display updated');
      }
    } catch (error) {
      console.error('[ComponentManager] Error updating object display:', error);
    }
  }

  /**
   * Add object to history
   */
  async addToHistory(objectData) {
    try {
      if (this.components.history) {
        await this.components.history.addToHistory(objectData);
      }
    } catch (error) {
      console.error('[ComponentManager] Error adding to history:', error);
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.components.objectDisplay) {
      this.components.objectDisplay.showLoading();
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.components.objectDisplay) {
      this.components.objectDisplay.hideLoading();
    }
  }

  /**
   * Show error state
   */
  showError() {
    // Show error overlay
    const overlay = document.querySelector('.overlay');
    if (overlay) {
      overlay.classList.remove('closed');
      overlay.classList.add('open', 'for-warning');
      $(overlay).fadeIn(500);
    }
  }

  /**
   * Hide error state
   */
  hideError() {
    const overlay = document.querySelector('.overlay');
    if (overlay) {
      $(overlay).fadeOut(500, () => {
        overlay.classList.remove('open', 'for-warning');
        overlay.classList.add('closed');
      });
    }
  }

  /**
   * Get current object data
   */
  getCurrentObject() {
    if (this.components.objectDisplay) {
      return this.components.objectDisplay.getCurrentObject();
    }
    return null;
  }

  /**
   * Get history data
   */
  getHistory() {
    if (this.components.history) {
      return this.components.history.getHistory();
    }
    return [];
  }

  /**
   * Clear history
   */
  async clearHistory() {
    if (this.components.history) {
      await this.components.history.clearHistory();
    }
  }

  /**
   * Update search terms display
   */
  updateSearchTerms(searchTerms) {
    if (this.components.sidePanel) {
      this.components.sidePanel.updateSearchTerms(searchTerms);
    }
  }

  /**
   * Open side panel
   */
  openSidePanel() {
    if (this.components.sidePanel) {
      this.components.sidePanel.openPanel();
    }
  }

  /**
   * Close side panel
   */
  closeSidePanel() {
    if (this.components.sidePanel) {
      this.components.sidePanel.closePanel();
    }
  }

  /**
   * Show history
   */
  showHistory() {
    if (this.components.history) {
      this.components.history.showHistory();
    }
  }

  /**
   * Hide history
   */
  hideHistory() {
    if (this.components.history) {
      this.components.history.hideHistory();
    }
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
   * Destroy all components
   */
  async destroy() {
    try {
      console.log('[ComponentManager] Destroying components...');

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
 * Handles the display of museum objects including:
 * - Object image and metadata
 * - Title, artist, and date information
 * - Technical details and descriptions
 * - Image loading and error states
 */

class ObjectDisplayComponent extends BaseComponent {
  constructor(options = {}) {
    super('ObjectDisplay', options);
    this.currentObject = null;
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Basic object info
      title: document.getElementById('title'),
      pieceDate: document.getElementById('piece-date'),
      creatorName: document.getElementById('creator-name'),
      datesAlive: document.getElementById('dates-alive'),
      place: document.getElementById('place'),
      // Image elements
      image: document.getElementById('image'),
      imageWrapper: document.querySelector('.object-image-wrapper'),
      // Description sections
      objectDescription: document.getElementById('object-description'),
      objectContext: document.getElementById('object-context'),
      // Technical information
      physicalDescription: document.getElementById('physical-description'),
      techInfoPlace: document.getElementById('tech-info-place'),
      techInfoPieceDate: document.getElementById('tech-info-piece-date'),
      techInfoCreatorName: document.getElementById('tech-info-creator-name'),
      techInfoMaterials: document.getElementById('tech-info-materials'),
      dimensions: document.getElementById('dimensions'),
      museumLocation: document.getElementById('museum-location'),
      museumNumber: document.getElementById('museum-number'),
      // Loading elements
      loading: document.querySelector('.loading'),
      // Navigation
      downArrow: document.querySelector('.down-arrow'),
      textContent: document.querySelector('.text-content-column')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Down arrow click for scrolling
    if (this.elements.downArrow) {
      this.addEvent(this.elements.downArrow, 'click', this.handleDownArrowClick);
    }

    // Image load events
    if (this.elements.image) {
      this.addEvent(this.elements.image, 'load', this.handleImageLoad);
      this.addEvent(this.elements.image, 'error', this.handleImageError);
    }
  }

  /**
   * Handle down arrow click for smooth scrolling
   */
  handleDownArrowClick(event) {
    event.preventDefault();
    if (this.elements.textContent) {
      $('#object-description').velocity('scroll', {
        duration: 700,
        offset: -100,
        easing: 'ease-in-out',
        container: $(this.elements.textContent)
      });
    }
  }

  /**
   * Handle successful image load
   */
  handleImageLoad(event) {
    console.log('[ObjectDisplay] Image loaded successfully');
    this.hide(this.elements.loading);
    this.show(this.elements.image, 'fadeIn');
  }

  /**
   * Handle image load error
   */
  handleImageError(event) {
    console.warn('[ObjectDisplay] Image failed to load');
    this.showImagePlaceholder();
  }

  /**
   * Show image placeholder when no image is available
   */
  showImagePlaceholder() {
    if (!this.elements.imageWrapper) return;
    const placeholderHTML = `
            <div class="image-placeholder">
                <p>Image not available</p>
                <p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p>
            </div>
        `;
    this.setHTML(this.elements.imageWrapper, placeholderHTML);
    this.hide(this.elements.loading);
  }

  /**
   * Update the display with new object data
   */
  updateDisplay(objectData) {
    if (!objectData) {
      console.warn('[ObjectDisplay] No object data provided');
      return;
    }
    this.currentObject = objectData;
    try {
      this.updateBasicInfo(objectData);
      this.updateImage(objectData);
      this.updateDescriptions(objectData);
      this.updateTechnicalInfo(objectData);
      this.handleTitleLength(objectData.title);
      console.log('[ObjectDisplay] Display updated successfully');
    } catch (error) {
      console.error('[ObjectDisplay] Error updating display:', error);
    }
  }

  /**
   * Update basic object information
   */
  updateBasicInfo(objectData) {
    // Update creator/artist information
    this.setText(this.elements.creatorName, objectData.artist);
    this.setText(this.elements.datesAlive, objectData.datesAlive);

    // Update title and date
    this.setHTML(this.elements.title, objectData.title);
    if (objectData.date && objectData.date !== "") {
      this.setText(this.elements.pieceDate, `(${objectData.date})`);
    } else {
      this.setText(this.elements.pieceDate, '');
    }

    // Update place information
    this.setHTML(this.elements.place, objectData.place);
  }

  /**
   * Update object image
   */
  updateImage(objectData) {
    if (!this.elements.image) return;
    if (objectData.imageUrl && objectData.imageUrl !== "") {
      // Show loading state
      this.show(this.elements.loading);
      this.hide(this.elements.image);

      // Set image source
      this.setAttribute(this.elements.image, 'src', objectData.imageUrl);

      // Update Pinterest URL
      this.updatePinterestUrl(objectData);
    } else {
      this.showImagePlaceholder();
    }
  }

  /**
   * Update Pinterest sharing URL
   */
  updatePinterestUrl(objectData) {
    const pinterestButton = document.getElementById('pinterest-button');
    if (!pinterestButton) return;
    let pinterestUrl = "https://www.pinterest.com/pin/create/button/";
    pinterestUrl += "?url=" + encodeURIComponent(objectData.objectUrl);
    pinterestUrl += "&media=" + encodeURIComponent(objectData.imageUrl);
    pinterestUrl += "&description=" + encodeURIComponent(objectData.title);
    if (objectData.date !== "") {
      pinterestUrl += encodeURIComponent(` (${objectData.place}, ${objectData.date})`);
    }
    pinterestUrl += encodeURIComponent(", V&A Collection");
    this.setAttribute(pinterestButton, 'href', pinterestUrl);
  }

  /**
   * Update object descriptions
   */
  updateDescriptions(objectData) {
    // Update main description
    if (objectData.description && objectData.description !== "") {
      this.setHTML(this.elements.objectDescription, `<p>${objectData.description}</p>`);
    } else {
      this.setHTML(this.elements.objectDescription, '<p></p>');
    }

    // Update context information
    if (objectData.context && objectData.context !== "") {
      this.setHTML(this.elements.objectContext, `<p>${objectData.context}</p>`);
    } else {
      this.setHTML(this.elements.objectContext, '<p></p>');
    }
  }

  /**
   * Update technical information
   */
  updateTechnicalInfo(objectData) {
    // Helper function to hide empty sections
    const hideIfEmpty = (element, value) => {
      if (!element) return;
      if (value && value !== "") {
        this.setText(element, value);
        $(element).closest('section').show();
      } else {
        $(element).closest('section').hide();
      }
    };

    // Update technical details
    hideIfEmpty(this.elements.physicalDescription, objectData.physicalDescription);
    hideIfEmpty(this.elements.techInfoPlace, objectData.place);
    hideIfEmpty(this.elements.techInfoPieceDate, objectData.date);
    hideIfEmpty(this.elements.techInfoCreatorName, objectData.artist);
    hideIfEmpty(this.elements.techInfoMaterials, objectData.materials);
    hideIfEmpty(this.elements.dimensions, objectData.dimensions);
    hideIfEmpty(this.elements.museumLocation, objectData.museumLocation);
    hideIfEmpty(this.elements.museumNumber, objectData.objectNumber);
  }

  /**
   * Handle long titles by adding CSS classes
   */
  handleTitleLength(title) {
    if (!title) return;
    if (title.length > 42) {
      this.toggleClass(this.elements.title, 'reduced', true);
      this.toggleClass(this.elements.pieceDate, 'reduced', true);
    } else {
      this.toggleClass(this.elements.title, 'reduced', false);
      this.toggleClass(this.elements.pieceDate, 'reduced', false);
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.show(this.elements.loading);
    this.hide(this.elements.image);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.hide(this.elements.loading);
  }

  /**
   * Clear the display
   */
  clear() {
    this.setText(this.elements.title, '');
    this.setText(this.elements.pieceDate, '');
    this.setText(this.elements.creatorName, '');
    this.setText(this.elements.datesAlive, '');
    this.setText(this.elements.place, '');
    this.setHTML(this.elements.objectDescription, '<p></p>');
    this.setHTML(this.elements.objectContext, '<p></p>');
    this.setAttribute(this.elements.image, 'src', '');
    this.hide(this.elements.image);
    this.currentObject = null;
  }

  /**
   * Get current object data
   */
  getCurrentObject() {
    return this.currentObject;
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
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
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