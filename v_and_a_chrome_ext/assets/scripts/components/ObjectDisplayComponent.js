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
        const fields = [
            { selector: "#physical-description", value: objectData.physicalDescription },
            { selector: "#tech-info-place", value: objectData.place },
            { selector: "#tech-info-piece-date", value: objectData.date },
            { selector: "#tech-info-creator-name", value: objectData.artist },
            { selector: "#tech-info-materials", value: objectData.materials },
            { selector: "#dimensions", value: objectData.dimensions },
            { selector: "#museum-location", value: objectData.museumLocation },
            { selector: "#museum-number", value: objectData.objectNumber }
        ];
        
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectDisplayComponent;
} else if (typeof window !== 'undefined') {
    window.ObjectDisplayComponent = ObjectDisplayComponent;
} 