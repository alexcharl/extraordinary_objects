/**
 * Main UI functionality for the V&A Chrome Extension
 * Refactored from 2_main.js with ES6 module structure
 */

// Global SITE object for backward compatibility
window.SITE = window.SITE || {};

// Global variables
let $window = null;
let $body = null;
let WIDTH = null;
let HEIGHT = null;
let isMobile = null;
let isTablet = null;
let isDevice = null;
let isTouch = null;
let browser;
let $wrapper;

// UI element references
let $textContent;
let $objectCaption;
let $downArrow;
let $objectHeader;
let $sidePanel;
let $sidePanelOpenBtn;
let $sidePanelCloseBtn;
let $historyOpenBtn;
let $overlayCloseBtn;
let $overlay;
let $techInfo;

// HISTORY
let theHistory = [];
const maxHistoryItems = 10;

// Make theHistory globally accessible
window.theHistory = theHistory;
window.maxHistoryItems = maxHistoryItems;

import { SidePanelComponent } from './components/SidePanelComponent.js';
import { HistoryComponent } from './components/HistoryComponent.js';
import { ObjectDisplayComponent } from './components/ObjectDisplayComponent.js';
import { OverlayComponent } from './components/OverlayComponent.js';

let sidePanelComponent;
let historyComponent;
let objectDisplayComponent;
let overlayComponent;

/**
 * Define variables from global context
 */
function defineVars() {
  const gv = window.gv;
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

  // SPECIFIC TO HERE
  $textContent = $('.text-content-column');
  $objectCaption = $('.object-caption');
  $downArrow = $('.down-arrow');
  $objectHeader = $('.object-header');
  $sidePanel = $('.side-panel');
  $sidePanelOpenBtn = $('.more');
  $sidePanelCloseBtn = $('.close-side-panel');
  $historyOpenBtn = $('.history');
  $overlayCloseBtn = $('.close-overlay');
  $overlay = $('.overlay');
  $techInfo = $('.technical-info .text-content');
}

/**
 * Initialize main functionality
 */
export function initMain() {
  defineVars();

  // Load history from Chrome storage
  if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
    chrome.storage.local.get(['objectHistory'], function(result) {
      if (result.objectHistory) {
        theHistory = result.objectHistory;
        window.theHistory = theHistory; // Update global reference
      }
    });
  }

  initFastclick();

  // Initialize components
  sidePanelComponent = new SidePanelComponent();
  sidePanelComponent.init();

  historyComponent = new HistoryComponent();
  historyComponent.init();

  objectDisplayComponent = new ObjectDisplayComponent();
  objectDisplayComponent.init();

  overlayComponent = new OverlayComponent();
  overlayComponent.init();

  handleClicks();

  // window resize things
  onResize();
  onThrottledResize();
  onDebouncedResize();
  $window.on('resize', onResize);
  $window.on('resize', throttledResize);
  $window.on('resize', debouncedResize);

  onThrottledScroll();
  $textContent.on('scroll', throttledScroll);
}

/**
 * Handle click events
 */
function handleClicks() {
  $downArrow.click(function() {
    $('#object-description').velocity('scroll', {
      duration: 700,
      offset: -100,
      easing: 'ease-in-out',
      container: $textContent
    });
  });

  $('.go-to-options').click(function() {
    if (chrome.runtime.openOptionsPage) {
      // New way to open options pages, if supported (Chrome 42+).
      chrome.runtime.openOptionsPage();
    } else {
      // Reasonable fallback.
      window.open(chrome.runtime.getURL('/src/options/index.html'));
    }
  });
}

/**
 * Show error overlay
 */
export function throwError() {
  overlayComponent.showErrorOverlay();
}

/**
 * Handle scroll events
 */
function onThrottledScroll() {
  const scrollAmt = $textContent.scrollTop();

  if (scrollAmt > HEIGHT*0.5) {
    // show the caption
    $objectCaption.addClass('reveal');
  } else {
    // hide the caption
    $objectCaption.removeClass('reveal');
  }

  if (scrollAmt > HEIGHT*0.5) {
    // hide the header
    $objectHeader.addClass('hide');
  } else {
    // show the header
    $objectHeader.removeClass('hide');
  }
}

const throttledScroll = function() {
  // DO SOMETHING EVERY 250ms
  onThrottledScroll();
};

/**
 * Handle resize events
 */
function onResize() { 
  WIDTH = $window.width();
  HEIGHT = $window.height();
  
  // Update component heights
  if (objectDisplayComponent) {
    objectDisplayComponent.updateHeight(HEIGHT);
  }
}

/**
 * Handle throttled resize events
 */
export function onThrottledResize() {
  // Placeholder for resize logic
}

/**
 * Handle debounced resize events
 */
function onDebouncedResize() {
  // console.log('debounce');
}

const throttledResize = $.throttle(250, function() {
  // DO SOMETHING EVERY 250ms
  onThrottledResize();
});

const debouncedResize = $.debounce(100, function() {
  onDebouncedResize();	
});

/**
 * Initialize FastClick for mobile
 */
function initFastclick() {
  if (typeof FastClick !== 'undefined' && FastClick) {
    FastClick.attach(document.body);
  }
}

// Export to global SITE object for backward compatibility
window.SITE.initMain = initMain;
window.SITE.throwError = throwError;
window.SITE.onThrottledResize = onThrottledResize; 