/**
 * Global variables and initialization for the V&A Chrome Extension
 * Refactored from 1_global.js with ES6 module structure
 */

import { defineDeviceVariables, browserDetection } from '../utils/helpers.js';

// Global SITE object for backward compatibility
window.SITE = window.SITE || {};

/**
 * Initialize global variables
 */
export function initGlobal() {
  const gv = window.gv = {
    $window: $(window),
    $document: $(document),
    $html: $('html'),
    $body: $('body'),
    WIDTH: $(window).width(),
    HEIGHT: $(window).height(),
    deviceVariables: defineDeviceVariables(),
    browser: browserDetection(),
    
    // site specific
    $wrapper: $('#wrapper')
  };

  console.log('initGlobal');
  
  return gv;
}

// Export to global SITE object for backward compatibility
window.SITE.initGlobal = initGlobal; 