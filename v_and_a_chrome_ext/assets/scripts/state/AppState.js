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
                const result = await new Promise((resolve) => {
                    chrome.storage.local.get([
                        'objectHistory',
                        'searchTerms',
                        'strictSearch',
                        'currentMuseum'
                    ], resolve);
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
                await new Promise((resolve) => {
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
        this.subscribers.set(id, { callback, selector });
        
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
        return { ...this.state }; // Return copy to prevent direct mutation
    }
    
    /**
     * Set state with partial update
     */
    setState(partialState) {
        const prevState = { ...this.state };
        
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
        const { type, payload } = action;
        
        switch (type) {
            case 'SET_CURRENT_OBJECT':
                this.setState({ currentObject: payload });
                break;
                
            case 'SET_LOADING':
                this.setState({ isLoading: payload });
                break;
                
            case 'SET_ERROR':
                this.setState({ error: payload });
                break;
                
            case 'ADD_TO_HISTORY':
                this.addToHistory(payload);
                break;
                
            case 'CLEAR_HISTORY':
                this.setState({ history: [] });
                break;
                
            case 'SET_UI_STATE':
                this.setState({ ui: { ...this.state.ui, ...payload } });
                break;
                
            case 'SET_SETTINGS':
                this.setState({ settings: { ...this.state.settings, ...payload } });
                break;
                
            case 'SET_API_STATE':
                this.setState({ api: { ...this.state.api, ...payload } });
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
        const filteredHistory = this.state.history.filter(
            item => item.objectNumber !== objectData.objectNumber
        );
        
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
        
        this.setState({ history: newHistory });
    }
    
    /**
     * Remove object from history
     */
    removeFromHistory(objectNumber) {
        const newHistory = this.state.history.filter(
            item => item.objectNumber !== objectNumber
        );
        this.setState({ history: newHistory });
    }
    
    /**
     * Notify subscribers of state changes
     */
    notifySubscribers(changedState) {
        this.subscribers.forEach(({ callback, selector }) => {
            try {
                if (selector) {
                    // Only notify if the selected part of state changed
                    const relevantState = selector(this.state);
                    callback(relevantState);
                } else {
                    // Notify with full state
                    callback({ ...this.state });
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
        return { ...this.state.settings };
    }
    
    getUIState() {
        return { ...this.state.ui };
    }
    
    getAPIState() {
        return { ...this.state.api };
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
} else if (typeof window !== 'undefined') {
    window.AppState = AppState;
} 