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
            const unsubscribe = this.appState.subscribe(
                (state) => this.handleStateUpdate(componentId, selectorName, state),
                selector
            );
            
            subscriptions[selectorName] = unsubscribe;
        });
        
        // Store subscriptions
        this.subscriptions.set(componentId, subscriptions);
        
        // Provide state methods to component
        this.attachStateMethods(component);
        
        console.log(`[StateConnector] Connected component: ${componentId}`);
        
        return {
            disconnect: () => this.disconnect(componentId),
            dispatch: (action) => this.appState.dispatch(action),
            getState: (selector) => this.appState.getState(selector)
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
        component.dispatch = (action) => {
            this.appState.dispatch(action);
        };
        
        // Attach getState method
        component.getState = (selector) => {
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
export const selectors = {
    // Object selectors
    currentObject: (state) => state.currentObject,
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,
    
    // History selectors
    history: (state) => state.history,
    historyCount: (state) => state.history.length,
    
    // UI selectors
    ui: (state) => state.ui,
    sidePanelOpen: (state) => state.ui.sidePanelOpen,
    historyOverlayOpen: (state) => state.ui.historyOverlayOpen,
    errorOverlayOpen: (state) => state.ui.errorOverlayOpen,
    
    // Settings selectors
    settings: (state) => state.settings,
    searchTerms: (state) => state.settings.searchTerms,
    strictSearch: (state) => state.settings.strictSearch,
    currentMuseum: (state) => state.settings.currentMuseum,
    
    // API selectors
    api: (state) => state.api,
    currentSearchTerm: (state) => state.api.currentSearchTerm,
    searchAttempts: (state) => state.api.searchAttempts,
    maxSearchAttempts: (state) => state.api.maxSearchAttempts,
    
    // Composite selectors
    hasReachedMaxAttempts: (state) => state.api.searchAttempts >= state.api.maxSearchAttempts,
    hasHistory: (state) => state.history.length > 0,
    hasCurrentObject: (state) => state.currentObject !== null
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StateConnector,
        selectors
    };
} else if (typeof window !== 'undefined') {
    window.StateConnector = StateConnector;
    window.stateSelectors = selectors;
} 