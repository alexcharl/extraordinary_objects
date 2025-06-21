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
        return { ...this.components };
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentManager;
} else if (typeof window !== 'undefined') {
    window.ComponentManager = ComponentManager;
} 