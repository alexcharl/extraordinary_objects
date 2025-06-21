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
                const result = await new Promise((resolve) => {
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
                await new Promise((resolve) => {
                    chrome.storage.local.set({ objectHistory: this.history }, resolve);
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
            this.setHTML(this.elements.historyObjects, 
                '<p class="no-history">No objects viewed yet. Start exploring the V&A collection!</p>'
            );
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryComponent;
} else if (typeof window !== 'undefined') {
    window.HistoryComponent = HistoryComponent;
} 