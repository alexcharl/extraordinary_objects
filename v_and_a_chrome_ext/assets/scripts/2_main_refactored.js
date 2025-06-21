/**
 * Main Application - Refactored Version
 * 
 * This version uses the modular component system for better maintainability
 * and extensibility. It replaces the monolithic approach with a clean
 * component-based architecture.
 */

(function(window, $, Modernizr) {
    'use strict';
    
    var pumkin = window.pumkin;
    var SITE = window.SITE = window.SITE || {};
    
    // Global variables
    var $window = null;
    var $body = null;
    var WIDTH = null;
    var HEIGHT = null;
    var isMobile = null;
    var isTablet = null;
    var isDevice = null;
    var isTouch = null;
    var browser;
    var $wrapper;
    
    // Component Manager instance
    var componentManager = null;
    
    /**
     * Initialize the application
     */
    async function initMain() {
        try {
            console.log('=== MAIN APPLICATION INITIALIZATION ===');
            
            // Define global variables
            defineVars();
            
            // Initialize component manager
            await initComponentManager();
            
            // Initialize remaining functionality
            initFastclick();
            initResizeHandlers();
            initScrollHandlers();
            
            console.log('Main application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize main application:', error);
            throw error;
        }
    }
    
    /**
     * Define global variables
     */
    function defineVars() {
        var gv = window.gv;
        if (!gv) {
            console.error('Global variables not available');
            return;
        }
        
        $window = gv.$window;
        $body = gv.$body;
        WIDTH = gv.WIDTH;
        HEIGHT = gv.HEIGHT;
        $wrapper = gv.$wrapper;

        isMobile = gv.deviceVariables.isMobile;
        isTablet = gv.deviceVariables.isTablet;
        isDevice = gv.deviceVariables.isDevice;
        isTouch = gv.deviceVariables.isTouch;

        browser = gv.browser;
        
        console.log('Global variables defined');
    }
    
    /**
     * Initialize the component manager
     */
    async function initComponentManager() {
        try {
            // Create component manager with configuration
            componentManager = new ComponentManager({
                maxHistoryItems: 10,
                objectDisplay: {
                    // Object display specific options
                },
                history: {
                    // History specific options
                },
                sidePanel: {
                    // Side panel specific options
                }
            });
            
            // Initialize all components
            await componentManager.init();
            
            // Make component manager globally available
            window.componentManager = componentManager;
            
            console.log('Component Manager initialized');
            
        } catch (error) {
            console.error('Failed to initialize Component Manager:', error);
            throw error;
        }
    }
    
    /**
     * Initialize FastClick for mobile (if available)
     */
    function initFastclick() {
        // FastClick is not available in this build, so we'll skip it
        // The component system will handle touch events appropriately
        console.log('FastClick not available - using native touch handling');
    }
    
    /**
     * Initialize resize handlers
     */
    function initResizeHandlers() {
        if (!$window) return;
        
        // Initial resize
        onResize();
        onThrottledResize();
        onDebouncedResize();
        
        // Bind resize events
        $window.on('resize', onResize);
        $window.on('resize', throttledResize);
        $window.on('resize', debouncedResize);
        
        console.log('Resize handlers initialized');
    }
    
    /**
     * Initialize scroll handlers
     */
    function initScrollHandlers() {
        const textContent = document.querySelector('.text-content-column');
        if (textContent) {
            onThrottledScroll();
            $(textContent).on('scroll', throttledScroll);
            console.log('Scroll handlers initialized');
        }
    }
    
    // Resize event handlers
    // ----------------------------------------------------
    
    function onResize() {
        // Update global dimensions
        if ($window) {
            WIDTH = $window.width();
            HEIGHT = $window.height();
        }
    }
    
    function onThrottledResize() {
        // Handle throttled resize events
        // Components will handle their own resize logic
    }
    
    function onDebouncedResize() {
        // Handle debounced resize events
        // Components will handle their own resize logic
    }
    
    // Scroll event handlers
    // ----------------------------------------------------
    
    function onThrottledScroll() {
        // Handle throttled scroll events
        // Components will handle their own scroll logic
    }
    
    // Throttle and debounce functions
    // ----------------------------------------------------
    
    function throttledResize() {
        if (window.throttledResizeTimer) {
            clearTimeout(window.throttledResizeTimer);
        }
        window.throttledResizeTimer = setTimeout(onThrottledResize, 100);
    }
    
    function debouncedResize() {
        if (window.debouncedResizeTimer) {
            clearTimeout(window.debouncedResizeTimer);
        }
        window.debouncedResizeTimer = setTimeout(onDebouncedResize, 250);
    }
    
    function throttledScroll() {
        if (window.throttledScrollTimer) {
            clearTimeout(window.throttledScrollTimer);
        }
        window.throttledScrollTimer = setTimeout(onThrottledScroll, 100);
    }
    
    // Error handling
    // ----------------------------------------------------
    
    function throwError() {
        if (componentManager) {
            componentManager.showError();
        } else {
            // Fallback error handling
            const overlay = document.querySelector('.overlay');
            if (overlay) {
                overlay.classList.remove('closed');
                overlay.classList.add('open', 'for-warning');
                $(overlay).fadeIn(500);
            }
        }
    }
    
    // Public API
    // ----------------------------------------------------
    
    // Expose functions to global scope
    SITE.initMain = initMain;
    SITE.throwError = throwError;
    
    // Expose component manager methods for backward compatibility
    SITE.updateObjectDisplay = function(objectData) {
        if (componentManager) {
            return componentManager.updateObjectDisplay(objectData);
        }
    };
    
    SITE.addToHistory = function(objectData) {
        if (componentManager) {
            return componentManager.addToHistory(objectData);
        }
    };
    
    SITE.showLoading = function() {
        if (componentManager) {
            componentManager.showLoading();
        }
    };
    
    SITE.hideLoading = function() {
        if (componentManager) {
            componentManager.hideLoading();
        }
    };
    
    SITE.getCurrentObject = function() {
        if (componentManager) {
            return componentManager.getCurrentObject();
        }
        return null;
    };
    
    SITE.getHistory = function() {
        if (componentManager) {
            return componentManager.getHistory();
        }
        return [];
    };
    
    // Cleanup function
    SITE.cleanup = async function() {
        if (componentManager) {
            await componentManager.destroy();
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMain);
    } else {
        initMain();
    }
    
})(window, jQuery, Modernizr); 