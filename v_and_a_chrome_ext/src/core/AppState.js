/**
 * Application State Management
 * Centralizes all application state for better control and Chrome Web Store compliance
 */

export class AppState {
  constructor() {
    this.state = {
      // Current object data
      currentObject: null,
      
      // API state
      api: {
        isLoading: false,
        error: null,
        searchCount: 0,
        maxSearchCounts: 5
      },
      
      // UI state
      ui: {
        sidePanelOpen: false,
        overlayVisible: false,
        overlayType: null, // 'error', 'info', etc.
        scrollPosition: 0,
        windowSize: {
          width: 0,
          height: 0
        }
      },
      
      // History state
      history: {
        items: [],
        maxItems: 10
      },
      
      // Settings
      settings: {
        searchTerms: [],
        strictSearch: false,
        museum: 'vanda' // 'vanda', 'smithsonian', etc.
      }
    };
    
    this.listeners = new Map();
    this.nextListenerId = 1;
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state slice
   */
  getStateSlice(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  /**
   * Update state
   */
  updateState(updates) {
    const oldState = { ...this.state };
    
    // Deep merge updates
    this.state = this.deepMerge(this.state, updates);
    
    // Notify listeners
    this.notifyListeners(oldState, this.state);
  }

  /**
   * Update specific state slice
   */
  updateStateSlice(path, value) {
    const pathArray = path.split('.');
    const updates = {};
    let current = updates;
    
    // Build nested update object
    for (let i = 0; i < pathArray.length - 1; i++) {
      current[pathArray[i]] = {};
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    this.updateState(updates);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    const id = this.nextListenerId++;
    this.listeners.set(id, listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(id);
    };
  }

  /**
   * Subscribe to specific state slice changes
   */
  subscribeToSlice(path, listener) {
    return this.subscribe((oldState, newState) => {
      const oldValue = this.getStateSlice.call({ state: oldState }, path);
      const newValue = this.getStateSlice.call({ state: newState }, path);
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        listener(newValue, oldValue);
      }
    });
  }

  /**
   * Notify all listeners
   */
  notifyListeners(oldState, newState) {
    this.listeners.forEach(listener => {
      try {
        listener(oldState, newState);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // Convenience methods for common state updates

  /**
   * Set current object
   */
  setCurrentObject(object) {
    this.updateStateSlice('currentObject', object);
  }

  /**
   * Set API loading state
   */
  setApiLoading(isLoading) {
    this.updateStateSlice('api.isLoading', isLoading);
  }

  /**
   * Set API error
   */
  setApiError(error) {
    this.updateStateSlice('api.error', error);
  }

  /**
   * Increment search count
   */
  incrementSearchCount() {
    const currentCount = this.getStateSlice('api.searchCount');
    this.updateStateSlice('api.searchCount', currentCount + 1);
  }

  /**
   * Reset search count
   */
  resetSearchCount() {
    this.updateStateSlice('api.searchCount', 0);
  }

  /**
   * Check if can search
   */
  canSearch() {
    const { searchCount, maxSearchCounts } = this.getStateSlice('api');
    return searchCount < maxSearchCounts;
  }

  /**
   * Toggle side panel
   */
  toggleSidePanel() {
    const isOpen = this.getStateSlice('ui.sidePanelOpen');
    this.updateStateSlice('ui.sidePanelOpen', !isOpen);
  }

  /**
   * Show overlay
   */
  showOverlay(type = 'info') {
    this.updateState({
      ui: {
        ...this.state.ui,
        overlayVisible: true,
        overlayType: type
      }
    });
  }

  /**
   * Hide overlay
   */
  hideOverlay() {
    this.updateState({
      ui: {
        ...this.state.ui,
        overlayVisible: false,
        overlayType: null
      }
    });
  }

  /**
   * Add item to history
   */
  addToHistory(object) {
    const history = this.getStateSlice('history');
    const newItems = [object, ...history.items.filter(item => item.id !== object.id)];
    
    this.updateState({
      history: {
        ...history,
        items: newItems.slice(0, history.maxItems)
      }
    });
    
    // Persist to Chrome storage
    this.saveHistory();
  }

  /**
   * Load history from Chrome storage
   */
  async loadHistory() {
    if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
      return new Promise((resolve) => {
        chrome.storage.local.get(['objectHistory'], (result) => {
          if (result.objectHistory && Array.isArray(result.objectHistory)) {
            // Convert old format to new format if needed
            const convertedHistory = result.objectHistory.map(item => ({
              id: item.systemNumber || item.objectNumber,
              title: item.title,
              date: item.date,
              maker: item.artist,
              imageUrl: item.imageUrl,
              collectionUrl: item.vaCollectionsUrl,
              // Keep other fields for backward compatibility
              ...item
            }));
            
            this.updateState({
              history: {
                ...this.state.history,
                items: convertedHistory.slice(0, this.state.history.maxItems)
              }
            });
          }
          // Always resolve, even if no history found
          resolve();
        });
      });
    } else {
      // If chrome storage is not available, resolve immediately
      return Promise.resolve();
    }
  }

  /**
   * Save history to Chrome storage
   */
  async saveHistory() {
    if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
      const history = this.getStateSlice('history');
      
      return new Promise((resolve) => {
        chrome.storage.local.set({
          objectHistory: history.items
        }, () => {
          resolve();
        });
      });
    }
  }

  /**
   * Update window size
   */
  updateWindowSize(width, height) {
    this.updateState({
      ui: {
        ...this.state.ui,
        windowSize: { width, height }
      }
    });
  }

  /**
   * Update scroll position
   */
  updateScrollPosition(position) {
    this.updateStateSlice('ui.scrollPosition', position);
  }

  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
      return new Promise((resolve) => {
        chrome.storage.sync.get({
          userSearchTerms: "",
          strictSearch: "fuzzy",
          museum: "vanda"
        }, (items) => {
          const searchTerms = items.userSearchTerms.length > 0 
            ? items.userSearchTerms.replace(/ /g, "+").split(",")
            : [];
          
          this.updateState({
            settings: {
              searchTerms,
              strictSearch: items.strictSearch === "strict",
              museum: items.museum
            }
          });
          
          resolve();
        });
      });
    }
  }

  /**
   * Save settings to Chrome storage
   */
  async saveSettings() {
    if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
      const settings = this.getStateSlice('settings');
      
      return new Promise((resolve) => {
        chrome.storage.sync.set({
          userSearchTerms: settings.searchTerms.join(","),
          strictSearch: settings.strictSearch ? "strict" : "fuzzy",
          museum: settings.museum
        }, resolve);
      });
    }
  }
} 