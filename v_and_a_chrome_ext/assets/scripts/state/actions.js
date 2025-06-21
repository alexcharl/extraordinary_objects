/**
 * Action Creators
 * 
 * Provides a clean interface for creating actions that update the application state.
 * Makes state updates more predictable and easier to debug.
 */

// Action Types
export const ActionTypes = {
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
export const objectActions = {
    setCurrentObject: (objectData) => ({
        type: ActionTypes.SET_CURRENT_OBJECT,
        payload: objectData
    }),
    
    clearCurrentObject: () => ({
        type: ActionTypes.CLEAR_CURRENT_OBJECT,
        payload: null
    })
};

// Loading Actions
export const loadingActions = {
    setLoading: (isLoading) => ({
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
export const errorActions = {
    setError: (error) => ({
        type: ActionTypes.SET_ERROR,
        payload: error
    }),
    
    clearError: () => ({
        type: ActionTypes.CLEAR_ERROR,
        payload: null
    })
};

// History Actions
export const historyActions = {
    addToHistory: (objectData) => ({
        type: ActionTypes.ADD_TO_HISTORY,
        payload: objectData
    }),
    
    removeFromHistory: (objectNumber) => ({
        type: ActionTypes.REMOVE_FROM_HISTORY,
        payload: objectNumber
    }),
    
    clearHistory: () => ({
        type: ActionTypes.CLEAR_HISTORY,
        payload: null
    })
};

// UI Actions
export const uiActions = {
    setUIState: (uiState) => ({
        type: ActionTypes.SET_UI_STATE,
        payload: uiState
    }),
    
    openSidePanel: () => ({
        type: ActionTypes.OPEN_SIDE_PANEL,
        payload: { sidePanelOpen: true }
    }),
    
    closeSidePanel: () => ({
        type: ActionTypes.CLOSE_SIDE_PANEL,
        payload: { sidePanelOpen: false }
    }),
    
    openHistoryOverlay: () => ({
        type: ActionTypes.OPEN_HISTORY_OVERLAY,
        payload: { historyOverlayOpen: true }
    }),
    
    closeHistoryOverlay: () => ({
        type: ActionTypes.CLOSE_HISTORY_OVERLAY,
        payload: { historyOverlayOpen: false }
    }),
    
    openErrorOverlay: () => ({
        type: ActionTypes.OPEN_ERROR_OVERLAY,
        payload: { errorOverlayOpen: true }
    }),
    
    closeErrorOverlay: () => ({
        type: ActionTypes.CLOSE_ERROR_OVERLAY,
        payload: { errorOverlayOpen: false }
    })
};

// Settings Actions
export const settingsActions = {
    setSettings: (settings) => ({
        type: ActionTypes.SET_SETTINGS,
        payload: settings
    }),
    
    updateSearchTerms: (searchTerms) => ({
        type: ActionTypes.UPDATE_SEARCH_TERMS,
        payload: { searchTerms }
    }),
    
    setStrictSearch: (strictSearch) => ({
        type: ActionTypes.SET_STRICT_SEARCH,
        payload: { strictSearch }
    }),
    
    setCurrentMuseum: (currentMuseum) => ({
        type: ActionTypes.SET_CURRENT_MUSEUM,
        payload: { currentMuseum }
    })
};

// API Actions
export const apiActions = {
    setAPIState: (apiState) => ({
        type: ActionTypes.SET_API_STATE,
        payload: apiState
    }),
    
    setCurrentSearchTerm: (searchTerm) => ({
        type: ActionTypes.SET_CURRENT_SEARCH_TERM,
        payload: { currentSearchTerm: searchTerm }
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
export const compositeActions = {
    // Load object and update state
    loadObject: (objectData) => [
        loadingActions.startLoading(),
        objectActions.setCurrentObject(objectData),
        historyActions.addToHistory(objectData),
        loadingActions.stopLoading(),
        errorActions.clearError()
    ],
    
    // Show error state
    showError: (error) => [
        errorActions.setError(error),
        loadingActions.stopLoading(),
        uiActions.openErrorOverlay()
    ],
    
    // Clear error state
    clearError: () => [
        errorActions.clearError(),
        uiActions.closeErrorOverlay()
    ],
    
    // Update search settings
    updateSearchSettings: (searchTerms, strictSearch) => [
        settingsActions.updateSearchTerms(searchTerms),
        settingsActions.setStrictSearch(strictSearch),
        apiActions.resetSearchAttempts()
    ],
    
    // Reset application state
    resetApp: () => [
        objectActions.clearCurrentObject(),
        loadingActions.stopLoading(),
        errorActions.clearError(),
        historyActions.clearHistory(),
        uiActions.setUIState({
            sidePanelOpen: false,
            historyOverlayOpen: false,
            errorOverlayOpen: false
        }),
        apiActions.resetSearchAttempts()
    ]
};

// Helper function to create batch actions
export const createBatchAction = (actions) => ({
    type: ActionTypes.BATCH_UPDATE,
    payload: actions
});

// Export all actions
export const actions = {
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
if (typeof module !== 'undefined' && module.exports) {
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