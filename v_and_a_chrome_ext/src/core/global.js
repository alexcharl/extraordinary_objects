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
  console.log('initGlobal: Starting...');
  
  try {
    console.log('initGlobal: Creating jQuery objects...');
    const gv = window.gv = {
      $window: $(window),
      $document: $(document),
      $html: $('html'),
      $body: $('body'),
      WIDTH: $(window).width(),
      HEIGHT: $(window).height(),
    };
    
    console.log('initGlobal: Getting device variables...');
    gv.deviceVariables = defineDeviceVariables();
    
    console.log('initGlobal: Getting browser detection...');
    gv.browser = browserDetection();
    
    console.log('initGlobal: Getting wrapper...');
    gv.$wrapper = $('#wrapper');
    
    console.log('initGlobal: Complete');
    return gv;
  } catch (error) {
    console.error('initGlobal: Error occurred:', error);
    throw error;
  }
}

// Export to global SITE object for backward compatibility
window.SITE.initGlobal = initGlobal; 