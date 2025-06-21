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
        return { ...this.components };
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentManager;
} else if (typeof window !== 'undefined') {
    window.ComponentManager = ComponentManager;
} 