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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectDisplayComponent;
} else if (typeof window !== 'undefined') {
    window.ObjectDisplayComponent = ObjectDisplayComponent;
} 