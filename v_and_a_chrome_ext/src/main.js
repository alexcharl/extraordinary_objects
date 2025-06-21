/**
 * Main entry point for the V&A Chrome Extension
 * Imports all modules and initializes the application
 */

// Import all modules
import { initGlobal } from './core/global.js';
import { initMain } from './ui/main.js';
import { start } from './api/va-api.js';

// Import helper functions (for global pumkin object)
import './utils/helpers.js';

// Global SITE object for backward compatibility
window.SITE = window.SITE || {};

/**
 * Initialize the application
 */
function init() {
  console.log('=== V&A Chrome Extension Initializing ===');
  
  // Initialize global variables first
  initGlobal();
  
  // Initialize main UI functionality
  initMain();
  
  // Start the V&A API integration
  start();
  
  console.log('=== V&A Chrome Extension Initialized ===');
}

// Initialize when DOM is ready
$(document).ready(function() {
  init();
});

// Export for potential external use
export { init }; 