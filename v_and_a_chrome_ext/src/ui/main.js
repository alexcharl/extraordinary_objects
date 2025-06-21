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
        console.log('Loaded history from storage:', theHistory.length, 'items');
      }
    });
  }

  initFastclick();
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

  console.log('initMain');
}

/**
 * Handle click events
 */
function handleClicks() {
  $sidePanelOpenBtn.click(function(){
    if ($sidePanel.hasClass('open')) {
      $sidePanel.removeClass('open');
    } else {
      $sidePanel.addClass('open');
    }
  });

  $sidePanelCloseBtn.click(function(){
    $sidePanel.removeClass('open');
  });

  $downArrow.click(function() {
    $('#object-description').velocity('scroll', {
      duration: 700,
      offset: -100,
      easing: 'ease-in-out',
      container: $textContent
    });
  });

  $historyOpenBtn.click(function() {
    if ($overlay.hasClass('closed')) {
      $overlay.removeClass('closed').addClass('open for-history');
      showHistory();
      $overlay.fadeIn(500);
    }
  });

  $overlayCloseBtn.click(function() {
    $overlay.fadeOut(500, function() {
      $overlay.removeClass('open for-history for-warning').addClass('closed');
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
  $overlay.removeClass('closed').addClass('open for-warning');
  $overlay.fadeIn(500);
}

/**
 * Show history overlay
 */
export function showHistory() {
  $('.history-wrapper .loading').addClass('loaded');
  getHistory();
}

/**
 * Hide history overlay
 */
export function hideHistory() {
  $('#history-objects').text('');
}

/**
 * Get and display history
 */
function getHistory() {
  // *** Populate the History page *** //
  let count = 0;
  const history = window.theHistory || theHistory || [];
  
  if (!history || history.length === 0) {
    $('#history-objects').html('<p class="no-history">No objects viewed yet. Start exploring the V&A collection!</p>');
    return;
  }
  
  history.forEach(function (i) {
    let historyObjectHTML = '';
    historyObjectHTML += '<a class="history-object hide-until-loaded" data-object-number="'+i.objectNumber+'" href="'+i.vaCollectionsUrl+'"';
    historyObjectHTML += 'title="View this item in the V&amp;A archive">';
    historyObjectHTML += '<div class="history-object-image-holder" ';
    historyObjectHTML += 'style="background-image: url(\''+i.imageUrl+'\');">';
    historyObjectHTML += '</div>';
    historyObjectHTML += '<img src="'+i.imageUrl+'" class="image-holder-for-loading" id="image-holder-'+count+'" >';
    historyObjectHTML += '<div class="history-object-info">';
    historyObjectHTML += '<p><strong>'+i.title+'</strong>, '+i.date+'</p>';
    historyObjectHTML += '<p>'+i.artist+'</p>';
    historyObjectHTML += '</div>';
    historyObjectHTML += '</a>';
    $('#history-objects').append(historyObjectHTML);
    $('#image-holder-'+count).on('load', function() {
      $(this).parent().addClass('loaded');
      $(this).remove(); // prevent memory leaks
    });
    count++;
  });
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
window.SITE.showHistory = showHistory;
window.SITE.hideHistory = hideHistory; 