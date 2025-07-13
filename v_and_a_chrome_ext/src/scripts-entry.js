/**
 * Main entry point for the V&A Chrome Extension
 * Imports all modules and initializes the application
 */

// Import all modules
import { initGlobal } from './core/global.js';
import { initMain } from './ui/main.js';
import { start } from './api/api-integration.js';

// Import helper functions (for global pumkin object)
import './utils/helpers.js';

// Global SITE object for backward compatibility
window.SITE = window.SITE || {};

/**
 * Initialize the application
 */
function init() {
  // Debug: Check jQuery version
  if (typeof jQuery === 'undefined') {
    console.error('jQuery not loaded');
  } else {
    console.log('jQuery version:', jQuery.fn.jquery);
  }
  
  try {
    console.log('init: Starting initialization...');
    
    // Initialize global variables first
    console.log('init: Calling initGlobal...');
    initGlobal();
    console.log('init: initGlobal completed');
    
    // Initialize main UI functionality
    console.log('init: Calling initMain...');
    initMain();
    console.log('init: initMain completed');
    
    // Start the new API integration
    console.log('init: Calling start...');
    start();
    console.log('init: start completed');
    
    console.log('init: All initialization complete!');
  } catch (error) {
    console.error('init: Error during initialization:', error);
    throw error;
  }
}

// Initialize when DOM is ready
$(document).ready(function() {
  init();
});

// Export for potential external use
export { init }; 