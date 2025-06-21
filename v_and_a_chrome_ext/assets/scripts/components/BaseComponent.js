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
        
        const boundHandler = (event) => this.handleEvent(event, handler);
        element.addEventListener(eventType, boundHandler);
        
        // Store for cleanup
        if (!this.events[eventType]) {
            this.events[eventType] = [];
        }
        this.events[eventType].push({ element, handler: boundHandler });
    }
    
    /**
     * Remove event listeners
     */
    removeEvents() {
        Object.keys(this.events).forEach(eventType => {
            this.events[eventType].forEach(({ element, handler }) => {
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseComponent;
} else if (typeof window !== 'undefined') {
    window.BaseComponent = BaseComponent;
} 