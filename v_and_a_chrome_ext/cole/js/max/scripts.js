/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./assets/scripts/0_helpers.js":
/*!*************************************!*\
  !*** ./assets/scripts/0_helpers.js ***!
  \*************************************/
/***/ (function() {

var pumkin = window.pumkin = {};
// GLOBAL VARIABLES

// change this depending on the site

(function (window, $, Modernizr) {
  function getTransformValues($element, type) {
    var transformMatrix = $element.css('transform');
    var transformValues = transformMatrix.match(/-?[0-9\.]+/g);
    var scale = transformValues[0];
    var translate = {
      x: transformValues[4] / scale,
      y: transformValues[5] / scale
    };
    if (type === 'scale') {
      return scale;
    } else if (type === 'translate') {
      return translate;
    } else if (type === 'raw') {
      return transformValues;
    }
  }
  function checkKey(e) {
    e = e || window.event;
    return e.keyCode;
  }
  function makePlaceholders(els, activeClass) {
    activeClass = activeClass || 'active';
    $(els).each(function () {
      var $el = $(this);
      var placeholder = $el.data().placeholder;
      $el.val(placeholder);
      if ($.trim($el.val()) === '') {
        $el.val(placeholder).removeClass(activeClass);
      }
      $el.focus(function () {
        if ($el.val() === placeholder) {
          $el.val('').addClass(activeClass);
        }
      }).blur(function () {
        if ($.trim($el.val()) === '') {
          $el.val(placeholder).removeClass(activeClass);
        }
      });
    });
  }
  function svgFallback() {
    $("img[src$='.svg']").each(function () {
      var $el = $(this);
      var origSrc = $el.attr('src');
      var pngSrc = origSrc.replace('.svg', '.png');
      $el.attr('src', pngSrc);
    });
  }
  function normalizeBoxHeights($els) {
    var max = 0;

    // get all the element heights and find the tallest
    $els.each(function () {
      max = Math.max($(this).height(), max);
    });

    // set them all to the height of the tallest
    $els.each(function () {
      $(this).height(max);
    });
  }
  function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  function autoFit($container, $items, margin, doHeightToo, includeLastRow, varyHeight, allSameWidth) {
    console.log('autoFit: ' + $items.length);
    margin = margin || 0;

    // check if we've covered the whole area with tiles
    // if we fall short, expand the tiles to meet the edge of the container
    // currently only works width-ways

    var containerWidth = $container.width() - margin;

    // reset the items to their regular (css-defined) width by removing style attributs
    $items.removeAttr('style');

    // create a master array which will hold the rows
    var allTheRows = [];

    // start a rowWidth variable to measure the combined width of items in each row
    var rowWidth = 0;

    // start an array for items in the current row
    var thisRow = [];

    // now loop through, we create a new array for each row then add it to the master
    $items.each(function () {
      // start adding up the widths until we can't fit another one in
      var $this = $(this);
      rowWidth += parseInt($this.css('width')) + margin;
      if (rowWidth <= containerWidth) {
        // add this item to the row array
        thisRow.push($this);
      } else {
        // add the row to the master array ...
        allTheRows.push(thisRow);

        // ... then start a new row array with this item in it
        thisRow = new Array($this);

        // and reset the rowWidth
        rowWidth = parseInt($this.css('width')) + margin;
      }
      if ($this.is(':last-child') && includeLastRow) {
        // add the final row to the master array ...
        allTheRows.push(thisRow);
      }
    });

    // now loop through the whole array and fit each one
    var numRows = allTheRows.length;
    for (var r = 0; r < numRows; r++) {
      var itemsInRow = allTheRows[r].length;

      // track the row width
      var rowTotalWidth = 0;
      for (var i = 0; i < itemsInRow; i++) {
        rowTotalWidth += parseInt(allTheRows[r][i].css('width')) + margin;
      }

      // what's the amount of remaining width for this row?
      var remainderWidth = containerWidth - rowTotalWidth;

      // width available to add to each item
      var spaceToAdd = remainderWidth / itemsInRow;

      // get the average item width
      var avgItemWidth = rowTotalWidth / itemsInRow;

      // track the new row width, we use to adjust if rounding errors prevent perfect alignment
      var newRowTotalWidth = 0;

      // in progress...
      if (allSameWidth) {
        var theWidth = parseInt(allTheRows[0][0].css('width'));
      }

      // now loop again and add add space according to 
      // the proportion of each item vs. the average item width
      for (i = 0; i < itemsInRow; i++) {
        var itemWidth = parseInt(allTheRows[r][i].css('width'));
        var itemRatio = itemWidth / avgItemWidth;
        var newWidth = allSameWidth ? itemWidth + spaceToAdd : itemWidth + Math.floor(spaceToAdd * itemRatio);
        var newHeight;

        // get the new height from the first element then apply to all the others
        if (r === 0 && i === 0) {
          var itemHeight = parseInt(allTheRows[r][i].css('height'));

          // set the new height to keep proportions (if option is true)
          newHeight = doHeightToo ? Math.floor(newWidth * (itemHeight / itemWidth)) : itemHeight;
        }
        if (varyHeight) {
          allTheRows[r][i].css({
            'width': newWidth
          });
        } else {
          allTheRows[r][i].css({
            'width': newWidth,
            'height': newHeight
          });
        }
        newRowTotalWidth += newWidth + margin;
      }

      // add or subtract any rounding error difference
      var difference = containerWidth - newRowTotalWidth;
      allTheRows[r][itemsInRow - 1].css('width', parseInt(allTheRows[r][itemsInRow - 1].css('width')) + difference);
    }
  }
  function intelliLoad($imgs, src, revealOnLoad) {
    // check if we have a library available (desandro's imagesLoaded) to listen for image load
    // if not, don't do revealOnLoad
    revealOnLoad = typeof imagesLoaded === "function" ? revealOnLoad : false;
    $imgs.each(function () {
      var $img = $(this);
      // under normal usage there'd be an image tag but no src attr
      // image source is held in data-src
      // can be overridden by passing src param if required
      var src = src || $img.data('src');
      if (revealOnLoad) {
        $img.css({
          'opacity': 0
        });
      }
      if (!$img.attr('src')) {
        $img.attr('src', src);
        console.log('INTELLILOAD: is image?' + $img.is('img'));
        if (revealOnLoad && $img.is('img')) {
          console.log('INTELLILOAD: revlealOnLoad: ' + src);
          $img.imagesLoaded().done(function (instance, image) {
            console.log('INTELLILOAD: imagesLoaded: ' + image.attr('src'));
            image.css({
              'opacity': 1
            }); // no animation via js - add a transition in css if you want
          });
        }
      }
    });
  }
  function defineDeviceVariables() {
    var deviceVariables;
    deviceVariables = {
      isMobile: $('#mobileTester').css('visibility') === 'visible' ? true : false,
      isTablet: $('#tabletTester').css('visibility') === 'visible' ? true : false,
      isTouch: Modernizr.touch ? true : false
    };
    deviceVariables.isDevice = deviceVariables.isMobile || deviceVariables.isTablet ? true : false;
    return deviceVariables;
  }
  function browserDetection() {
    var browser = {};
    browser.isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    browser.isExplorer = navigator.userAgent.indexOf('MSIE') > -1;
    browser.isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    browser.isSafari = navigator.userAgent.indexOf('Safari') > -1;
    browser.isOpera = navigator.userAgent.indexOf('Presto') > -1;
    if (browser.isChrome && browser.isSafari) {
      browser.isSafari = false;
    }
    return browser;
  }
  pumkin = {
    getTransformValues: getTransformValues,
    checkKey: checkKey,
    svgFallback: svgFallback,
    normalizeBoxHeights: normalizeBoxHeights,
    randomNum: randomNum,
    autoFit: autoFit,
    defineDeviceVariables: defineDeviceVariables,
    browserDetection: browserDetection,
    makePlaceholders: makePlaceholders,
    intelliLoad: intelliLoad
  };
})(this, this.jQuery, this.Modernizr);

/***/ }),

/***/ "./assets/scripts/1_global.js":
/*!************************************!*\
  !*** ./assets/scripts/1_global.js ***!
  \************************************/
/***/ (function() {

;
(function (window, $, Modernizr) {
  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};
  function initGlobal() {
    var gv;
    gv = window.gv = {
      $window: $(window),
      $document: $(document),
      $html: $('html'),
      $body: $('body'),
      WIDTH: $(window).width(),
      HEIGHT: $(window).height(),
      deviceVariables: pumkin.defineDeviceVariables(),
      browser: pumkin.browserDetection(),
      // site specific
      $wrapper: $('#wrapper')
    };
    console.log('initGlobal');
  }

  // EXPORT
  SITE.initGlobal = initGlobal;
})(this, this.jQuery, this.Modernizr);

/***/ }),

/***/ "./assets/scripts/2_main.js":
/*!**********************************!*\
  !*** ./assets/scripts/2_main.js ***!
  \**********************************/
/***/ (function() {

;
(function (window, $, Modernizr, screenfull, FastClick) {
  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};

  //define empty page vars

  //GLOBAL
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

  // HISTORY
  var theHistory = [];
  var maxHistoryItems = 10;

  // Make theHistory globally accessible
  window.theHistory = theHistory;
  window.maxHistoryItems = maxHistoryItems;

  // SPECIFIC TO HERE

  // FUNCTIONS FROM ELSEWHERE

  function defineVars() {
    var gv = window.gv;
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

    // FUNCTIONS FROM ELSEWHERE
  }
  function initMain() {
    defineVars();

    // Load history from Chrome storage
    if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
      chrome.storage.local.get(['objectHistory'], function (result) {
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
  function handleClicks() {
    $sidePanelOpenBtn.click(function () {
      if ($sidePanel.hasClass('open')) {
        $sidePanel.removeClass('open');
      } else {
        $sidePanel.addClass('open');
      }
    });
    $sidePanelCloseBtn.click(function () {
      $sidePanel.removeClass('open');
    });
    $downArrow.click(function () {
      $('#object-description').velocity('scroll', {
        duration: 700,
        offset: -100,
        easing: 'ease-in-out',
        container: $textContent
      });
    });
    $historyOpenBtn.click(function () {
      if ($overlay.hasClass('closed')) {
        $overlay.removeClass('closed').addClass('open for-history');
        showHistory();
        $overlay.fadeIn(500);
      }
    });
    $overlayCloseBtn.click(function () {
      $overlay.fadeOut(500, function () {
        $overlay.removeClass('open for-history for-warning').addClass('closed');
      });
    });
    $('.go-to-options').click(function () {
      if (chrome.runtime.openOptionsPage) {
        // New way to open options pages, if supported (Chrome 42+).
        chrome.runtime.openOptionsPage();
      } else {
        // Reasonable fallback.
        window.open(chrome.runtime.getURL('/src/options/index.html'));
      }
    });
  }
  function throwError() {
    $overlay.removeClass('closed').addClass('open for-warning');
    $overlay.fadeIn(500);
  }

  // Object History
  // ----------------------------------------------------

  function showHistory() {
    $('.history-wrapper .loading').addClass('loaded');
    getHistory();
  }
  function hideHistory() {
    $('#history-objects').text('');
  }
  function getHistory() {
    // *** Populate the History page *** //
    var count = 0;
    var history = window.theHistory || theHistory || [];
    if (!history || history.length === 0) {
      $('#history-objects').html('<p class="no-history">No objects viewed yet. Start exploring the V&A collection!</p>');
      return;
    }
    history.forEach(function (i) {
      var historyObjectHTML = '';
      historyObjectHTML += '<a class="history-object hide-until-loaded" data-object-number="' + i.objectNumber + '" href="' + i.vaCollectionsUrl + '"';
      historyObjectHTML += 'title="View this item in the V&amp;A archive">';
      historyObjectHTML += '<div class="history-object-image-holder" ';
      historyObjectHTML += 'style="background-image: url(\'' + i.imageUrl + '\');">';
      historyObjectHTML += '</div>';
      historyObjectHTML += '<img src="' + i.imageUrl + '" class="image-holder-for-loading" id="image-holder-' + count + '" >';
      historyObjectHTML += '<div class="history-object-info">';
      historyObjectHTML += '<p><strong>' + i.title + '</strong>, ' + i.date + '</p>';
      historyObjectHTML += '<p>' + i.artist + '</p>';
      historyObjectHTML += '</div>';
      historyObjectHTML += '</a>';
      $('#history-objects').append(historyObjectHTML);
      $('#image-holder-' + count).on('load', function () {
        $(this).parent().addClass('loaded');
        $(this).remove(); // prevent memory leaks
      });
      count++;
    });
  }

  // Scroll events
  // ----------------------------------------------------

  function onThrottledScroll() {
    var scrollAmt = $textContent.scrollTop();
    if (scrollAmt > HEIGHT * 0.5) {
      // show the caption
      $objectCaption.addClass('reveal');
    } else {
      // hide the caption
      $objectCaption.removeClass('reveal');
    }
    if (scrollAmt > HEIGHT * 0.5) {
      // hide the header
      $objectHeader.addClass('hide');
    } else {
      // show the header
      $objectHeader.removeClass('hide');
    }
  }
  var throttledScroll = function () {
    // DO SOMETHING EVERY 250ms
    onThrottledScroll();
  };

  // RESIZE SCRIPTS
  // ----------------------------------------------------
  function onResize() {
    WIDTH = $window.width();
    HEIGHT = $window.height();
  }
  function onThrottledResize() {}
  function onDebouncedResize() {
    // console.log('debounce');
  }
  var throttledResize = $.throttle(250, function () {
    // DO SOMETHING EVERY 250ms
    onThrottledResize();
  });
  var debouncedResize = $.debounce(100, function () {
    onDebouncedResize();
  });

  // INITIALISE FASTCLICK
  function initFastclick() {
    if (typeof FastClick !== 'undefined' && FastClick) {
      FastClick.attach(document.body);
    }
  }

  // EXPORT
  SITE.initMain = initMain;
  SITE.throwError = throwError;
  SITE.onThrottledResize = onThrottledResize;
  SITE.showHistory = showHistory;
  SITE.hideHistory = hideHistory;
})(this, this.jQuery, this.Modernizr, this.screenfull, this.FastClick);

/***/ }),

/***/ "./assets/scripts/3_va_api.js":
/*!************************************!*\
  !*** ./assets/scripts/3_va_api.js ***!
  \************************************/
/***/ (function() {

/**
 * V&A API - Refactored Version
 * 
 * This version uses the Museum API abstraction layer while maintaining
 * all existing functionality and compatibility.
 */

(function (window, $, Modernizr) {
  'use strict';

  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};

  // Create the V&A API instance
  var museumApi = null;
  var chosenSearchTerm = null;

  /**
   * Start function - initializes the API and begins the search process
   */
  async function start() {
    console.log("=== V&A API START FUNCTION CALLED ===");
    console.log("Initializing museum API...");
    try {
      // Create V&A API instance
      museumApi = SITE.MuseumApiFactory.create('vanda');

      // Initialize the API (loads user settings)
      await museumApi.initialize();

      // Test background script communication
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        console.log("Testing background script communication...");
        chrome.runtime.sendMessage({
          action: 'test'
        }, function (response) {
          console.log("Background script test response:", response);
        });
      }

      // Choose a search term and start the search process
      chosenSearchTerm = museumApi.chooseSearchTerm();
      await makeVaRequest(null, chosenSearchTerm);
    } catch (error) {
      console.error("Failed to initialize museum API:", error);
      SITE.throwError();
    }
  }

  /**
   * Make a V&A API request (maintains compatibility with existing code)
   */
  async function makeVaRequest(systemNumber, searchTerm, offset, limit, withImages, withDescription, after, random) {
    try {
      // Handle different request types based on parameters
      let expectResponse = 0;
      if (offset != null) {
        expectResponse = 1;
      } else if (systemNumber != null) {
        expectResponse = 2;
      }
      console.log("expectResponse = " + expectResponse);
      console.log("Chosen term = " + searchTerm);
      console.log("offset = " + offset);
      let searchParams = {
        searchTerm: searchTerm,
        offset: offset,
        limit: limit || "1",
        withImages: withImages || "1",
        withDescription: withDescription || "1",
        after: after,
        random: random || "0",
        hasImage: "1"
      };

      // Handle strict search mode
      if (museumApi.strictSearch) {
        searchParams.searchTerm = searchTerm;
        console.log("strictSearch = true");
      }

      // Make the search request
      const data = await museumApi.search(searchParams);

      // Process the response
      await processResponse(data, expectResponse);
    } catch (error) {
      console.error("API request failed:", error);
      if (museumApi.hasExceededMaxAttempts()) {
        console.log("maximum number of search attempts reached, try changing search terms");
        SITE.throwError();
      } else {
        // Retry with different search term
        chosenSearchTerm = museumApi.chooseSearchTerm();
        await makeVaRequest(null, chosenSearchTerm);
      }
    }
  }

  /**
   * Process API response (maintains compatibility with existing code)
   */
  async function processResponse(data, expectResponse) {
    console.log("Processing response:", data);
    if (expectResponse === 0) {
      // Initial search - get total count and choose random object
      const numRecords = data.records.length;
      if (numRecords > 0) {
        const randomOffset = pumkin.randomNum(0, data.info.record_count - 1);
        console.log("total results = " + data.info.record_count);
        console.log("randomOffset range: 0 to " + (data.info.record_count - 1));
        console.log("generated randomOffset = " + randomOffset);
        console.log("making query 2, with randomOffset of " + randomOffset);
        await makeVaRequest(null, chosenSearchTerm, randomOffset);
      } else {
        console.log("making a second request, no results found last time");
        chosenSearchTerm = museumApi.chooseSearchTerm();
        await makeVaRequest(null, chosenSearchTerm);
      }
      return;
    }
    if (expectResponse === 1) {
      // Got search results - get first object's system number
      const numRecords = data.records.length;
      console.log("There are " + numRecords + " objects available.");
      const whichObject = data.records[0];
      const systemNumber = whichObject.systemNumber;
      console.log("Selected object system number: " + systemNumber);
      await makeVaRequest(systemNumber);
      return;
    }

    // Process individual object data
    if (!data.records || data.records.length === 0) {
      console.log("No object found for system number, trying a different search term");
      chosenSearchTerm = museumApi.chooseSearchTerm();
      await makeVaRequest(null, chosenSearchTerm);
      return;
    }

    // Process the object data using the abstraction layer
    const objectData = museumApi.processObjectData(data);

    // Update the UI with the processed data
    updateUI(objectData);

    // Save to history if this is a final object (not a search step)
    if (expectResponse !== 0 && expectResponse !== 1) {
      saveToHistory(objectData);
    }
  }

  /**
   * Update the UI with object data
   */
  function updateUI(objectData) {
    console.log("Updating UI with object data:", objectData);

    // Handle title length for CSS classes
    if (objectData.title.length > 42) {
      $("#title").addClass("reduced");
      $("#piece-date").addClass("reduced");
    }

    // Update basic information
    $("#creator-name").text(objectData.artist);
    $("#dates-alive").text(objectData.datesAlive);
    $("#title").html(objectData.title);
    if (objectData.date !== "") {
      $("#piece-date").text("(" + objectData.date + ")");
    }
    $("#place").html(objectData.place);

    // Handle image display
    if (objectData.imageUrl && objectData.imageUrl !== "") {
      $("#image").attr("src", objectData.imageUrl);

      // Build Pinterest URL
      let pinterestUrl = "https://www.pinterest.com/pin/create/button/";
      pinterestUrl += "?url=" + objectData.objectUrl;
      pinterestUrl += "&media=" + objectData.imageUrl;
      pinterestUrl += "&description=" + objectData.title;
      if (objectData.date !== "") {
        pinterestUrl += " (" + objectData.place + ", " + objectData.date + ")";
      }
      pinterestUrl += ", V%26A Collection";
      $("#pinterest-button").attr("href", pinterestUrl);
    } else {
      // No image available - show placeholder
      var $imageContainer = $('.object-image-wrapper');
      $imageContainer.html('<div class="image-placeholder"><p>Image not available</p><p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p></div>');
    }

    // Update links
    $("#page-link").attr("href", objectData.objectUrl);

    // Update descriptions
    const descriptionContent = objectData.description && objectData.description.trim() !== "" ? objectData.description : "No description available for this object.";
    $("#object-description").html("<p>" + descriptionContent + "</p>");
    $("#object-side-caption").html(objectData.sideCaption);

    // Update technical information (hide empty fields)
    updateTechnicalInfo(objectData);

    // Trigger resize and mark as loaded
    SITE.onThrottledResize();
    $(".content-placeholder, .hide-until-loaded").addClass("loaded");

    // Handle image loading with error fallback
    if (objectData.imageUrl && objectData.imageUrl !== "") {
      $("img.image-hide-until-loaded").on('load', function () {
        $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
        $(this).removeClass("image-error");
      }).on('error', function () {
        console.log("Image failed to load:", objectData.imageUrl);
        var $imageContainer = $(this).closest('.object-image-wrapper');
        $imageContainer.html('<div class="image-placeholder"><p>Image not available</p><p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p></div>');
        $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
      });
    } else {
      // No image to load, so mark as loaded immediately
      $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
    }
  }

  /**
   * Update technical information fields
   */
  function updateTechnicalInfo(objectData) {
    // Helper function to hide empty fields
    function hideIfEmpty(selector, value) {
      if (value && value !== "") {
        $(selector).text(value);
      } else {
        $(selector).hide();
        $(selector).prev("h4").hide();
      }
    }
    hideIfEmpty("#tech-info-piece-date", objectData.date);
    hideIfEmpty("#tech-info-creator-name", objectData.artist);
    hideIfEmpty("#tech-info-place", objectData.place);
    hideIfEmpty("#museum-location", objectData.museumLocation);
    hideIfEmpty("#museum-number", objectData.accessionNumber);

    // Hide physical description and materials (not available in v2 API)
    $("#physical-description").hide();
    $("#physical-description").prev("h4").hide();
    $("#tech-info-materials").hide();
    $("#tech-info-materials").prev("h4").hide();
    $("#dimensions").hide();
    $("#dimensions").prev("h4").hide();
  }

  /**
   * Save object to history
   */
  function saveToHistory(objectData) {
    const historyObject = {
      objectNumber: objectData.systemNumber,
      vaCollectionsUrl: objectData.objectUrl,
      imageUrl: objectData.imageUrl,
      title: objectData.title,
      date: objectData.date,
      artist: objectData.artist,
      systemNumber: objectData.systemNumber
    };
    var history = window.theHistory || [];
    history.push(historyObject);
    if (history.length > (window.maxHistoryItems || 10)) {
      history.shift();
    }
    window.theHistory = history;
    if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
      chrome.storage.local.set({
        objectHistory: history
      }, function () {
        console.log('History saved to storage:', history.length, 'items');
      });
    }
  }

  // Export functions to maintain compatibility
  SITE.start = start;
  SITE.makeVaRequest = makeVaRequest;
  SITE.processResponse = processResponse;
})(this, this.jQuery, this.Modernizr);

/***/ }),

/***/ "./assets/scripts/museumApi.js":
/*!*************************************!*\
  !*** ./assets/scripts/museumApi.js ***!
  \*************************************/
/***/ (function() {

/**
 * Museum API Abstraction Layer
 * 
 * This module provides a unified interface for different museum APIs.
 * It allows easy switching between V&A, Smithsonian, Rijksmuseum, etc.
 */

(function (window, $) {
  'use strict';

  var pumkin = window.pumkin;
  var SITE = window.SITE = window.SITE || {};

  /**
   * Base Museum API Interface
   * All museum API implementations should extend this class
   */
  class MuseumApi {
    constructor(config) {
      this.config = config || {};
      this.searchCount = 0;
      this.maxSearchCounts = 5;
    }

    /**
     * Initialize the API
     * @param {Object} options - Configuration options
     * @returns {Promise} - Promise that resolves when initialization is complete
     */
    async initialize(options) {
      throw new Error('initialize() must be implemented by subclass');
    }

    /**
     * Make a search request
     * @param {Object} params - Search parameters
     * @returns {Promise} - Promise that resolves with search results
     */
    async search(params) {
      throw new Error('search() must be implemented by subclass');
    }

    /**
     * Get a specific object by ID
     * @param {string} objectId - The object's unique identifier
     * @returns {Promise} - Promise that resolves with object data
     */
    async getObject(objectId) {
      throw new Error('getObject() must be implemented by subclass');
    }

    /**
     * Process and normalize object data
     * @param {Object} rawData - Raw data from the API
     * @returns {Object} - Normalized object data
     */
    processObjectData(rawData) {
      throw new Error('processObjectData() must be implemented by subclass');
    }

    /**
     * Build image URL for an object
     * @param {string} imageId - Image identifier
     * @returns {string} - Complete image URL
     */
    buildImageUrl(imageId) {
      throw new Error('buildImageUrl() must be implemented by subclass');
    }

    /**
     * Build object URL for external links
     * @param {string} objectId - Object identifier
     * @returns {string} - Complete object URL
     */
    buildObjectUrl(objectId) {
      throw new Error('buildObjectUrl() must be implemented by subclass');
    }

    /**
     * Get search terms for this museum
     * @returns {Array} - Array of search terms
     */
    getSearchTerms() {
      throw new Error('getSearchTerms() must be implemented by subclass');
    }

    /**
     * Choose a random search term
     * @returns {string} - Selected search term
     */
    chooseSearchTerm() {
      const searchTerms = this.getSearchTerms();
      const chosenTerm = searchTerms[pumkin.randomNum(0, searchTerms.length)];
      console.log("Chosen search term: " + chosenTerm + " from " + searchTerms.length + " available terms");
      return chosenTerm;
    }

    /**
     * Check if we've exceeded maximum search attempts
     * @returns {boolean} - True if max attempts reached
     */
    hasExceededMaxAttempts() {
      return this.searchCount >= this.maxSearchCounts;
    }

    /**
     * Increment search count
     */
    incrementSearchCount() {
      this.searchCount++;
    }

    /**
     * Reset search count
     */
    resetSearchCount() {
      this.searchCount = 0;
    }
  }

  /**
   * V&A Museum API Implementation
   */
  class VandAApi extends MuseumApi {
    constructor() {
      super();
      this.baseUrl = "https://api.vam.ac.uk/v2/objects/search";
      this.mediaUrl = "https://media.vam.ac.uk/media/thira/collection_images/";
      this.collectionsUrl = "https://collections.vam.ac.uk/item/";
      this.defaultSearchTerms = ["Architecture", "Asia", "British Galleries", "Ceramics", "Childhood", "Contemporary", "Fashion", "Jewellery", "Furniture", "Glass", "Metalwork", "Paintings", "Drawings", "Photography", "Prints", "Books", "Sculpture", "Textiles", "Theatre"];
      this.searchTerms = this.defaultSearchTerms;
      this.strictSearch = false;
    }

    /**
     * Initialize the V&A API with user settings
     */
    async initialize() {
      return new Promise(resolve => {
        if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
          chrome.storage.sync.get({
            userSearchTerms: "",
            strictSearch: "fuzzy"
          }, items => {
            if (items.userSearchTerms.length > 0) {
              console.log("using user search terms: " + items.userSearchTerms);
              this.searchTerms = items.userSearchTerms.replace(/ /g, "+").split(",");
            } else {
              console.log("using default search terms: " + this.defaultSearchTerms);
              this.searchTerms = this.defaultSearchTerms;
            }
            console.log("strictSearch setting = " + items.strictSearch);
            this.strictSearch = items.strictSearch === "strict";

            // Display search terms in the side panel
            const searchTermsDisplay = this.searchTerms.join(", ");
            $("#search-terms").text(searchTermsDisplay);
            resolve();
          });
        } else {
          console.log("Running as standalone page, using default search terms");
          this.searchTerms = this.defaultSearchTerms;

          // Display search terms in the side panel
          const searchTermsDisplay = this.searchTerms.join(", ");
          $("#search-terms").text(searchTermsDisplay);
          resolve();
        }
      });
    }

    /**
     * Make a search request to V&A API
     */
    async search(params = {}) {
      const {
        searchTerm = null,
        offset = null,
        limit = "1",
        withImages = "1",
        withDescription = "1",
        after = null,
        random = "0",
        hasImage = "1"
      } = params;
      this.incrementSearchCount();
      if (this.hasExceededMaxAttempts()) {
        throw new Error("Maximum number of search attempts reached");
      }
      return new Promise((resolve, reject) => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          console.log("Sending message to background script...");
          chrome.runtime.sendMessage({
            action: 'makeVaRequest',
            params: {
              searchTerm: searchTerm,
              offset: offset,
              limit: limit,
              withImages: withImages,
              withDescription: withDescription,
              after: after,
              random: random,
              hasImage: hasImage
            }
          }, response => {
            console.log("Received response from background script:", response);
            if (response && response.success) {
              console.log("API request successful");
              resolve(response.data);
            } else {
              console.log("API request failed:", response ? response.error : "No response");
              reject(new Error(response ? response.error : "API request failed"));
            }
          });
        } else {
          console.log("Running as standalone page - API requests will fail due to CORS");
          reject(new Error("CORS not supported in standalone mode"));
        }
      });
    }

    /**
     * Get a specific object by system number
     */
    async getObject(systemNumber) {
      return this.search({
        systemNumber: systemNumber
      });
    }

    /**
     * Process and normalize V&A object data
     */
    processObjectData(rawData) {
      if (!rawData.records || rawData.records.length === 0) {
        throw new Error("No object data found");
      }
      const objectInfo = rawData.records[0];
      const imageId = objectInfo._primaryImageId;

      // Handle artist dates
      let datesAlive = "";
      if (objectInfo._primaryMaker && objectInfo._primaryMaker.birthYear) {
        const birthYear = objectInfo._primaryMaker.birthYear;
        const deathYear = objectInfo._primaryMaker.deathYear;
        if (birthYear && deathYear) {
          datesAlive = "(" + birthYear + " - " + deathYear + ")";
        } else if (birthYear) {
          datesAlive = "(Born " + birthYear + ")";
        }
      }

      // Clean up title
      let title = objectInfo._primaryTitle != "" ? objectInfo._primaryTitle : objectInfo.objectType;
      title = title.replace(/\^/, "").replace(/\<i\>/g, "").replace(/\<\\i\>/g, "").replace(/\<b\>/g, "").replace(/\<\\b\>/g, "");

      // Create description from available data
      const descriptionParts = [];
      if (title && title !== objectInfo.objectType) {
        descriptionParts.push(title);
      }
      if (objectInfo._primaryDate) {
        descriptionParts.push("Dated " + objectInfo._primaryDate);
      }
      if (objectInfo._primaryPlace) {
        descriptionParts.push("from " + objectInfo._primaryPlace);
      }
      if (objectInfo._primaryMaker && objectInfo._primaryMaker.name && objectInfo._primaryMaker.name !== "Unknown") {
        descriptionParts.push("by " + objectInfo._primaryMaker.name);
      }
      const description = descriptionParts.length > 0 ? descriptionParts.join(", ") + "." : "A " + objectInfo.objectType + " from the V&A collection.";
      return {
        // Basic info
        title: title,
        objectType: objectInfo.objectType,
        date: objectInfo._primaryDate || "",
        artist: objectInfo._primaryMaker && objectInfo._primaryMaker.name ? objectInfo._primaryMaker.name : "",
        datesAlive: datesAlive,
        place: objectInfo._primaryPlace || "",
        // Identifiers
        systemNumber: objectInfo.systemNumber,
        accessionNumber: objectInfo.accessionNumber,
        imageId: imageId,
        // URLs
        imageUrl: this.buildImageUrl(imageId),
        objectUrl: this.buildObjectUrl(objectInfo.systemNumber),
        // Descriptions
        description: description,
        sideCaption: "<strong>" + title + " " + (objectInfo._primaryDate || "") + "</strong>" + " &mdash; " + (objectInfo._primaryMaker && objectInfo._primaryMaker.name ? objectInfo._primaryMaker.name : "") + " " + datesAlive,
        // Museum info
        museumLocation: objectInfo._currentLocation ? objectInfo._currentLocation.displayName : "",
        // Raw data for additional processing
        rawData: objectInfo
      };
    }

    /**
     * Build V&A image URL using IIIF format
     */
    buildImageUrl(imageId) {
      if (imageId && imageId !== null && imageId !== "") {
        return "https://framemark.vam.ac.uk/collections/" + imageId + "/full/1000,/0/default.jpg";
      }
      return "";
    }

    /**
     * Build V&A object URL
     */
    buildObjectUrl(systemNumber) {
      return this.collectionsUrl + systemNumber + "/" + systemNumber;
    }

    /**
     * Get search terms for V&A
     */
    getSearchTerms() {
      return this.searchTerms;
    }

    /**
     * Choose a random search term for V&A
     */
    chooseSearchTerm() {
      return this.searchTerms[pumkin.randomNum(0, this.searchTerms.length)];
    }
  }

  /**
   * Museum API Factory
   * Creates and returns the appropriate API implementation
   */
  class MuseumApiFactory {
    static create(museumType = 'vanda') {
      switch (museumType.toLowerCase()) {
        case 'vanda':
        case 'v&a':
        case 'victoria':
          return new VandAApi();
        // Future implementations:
        // case 'smithsonian':
        //     return new SmithsonianApi();
        // case 'rijksmuseum':
        //     return new RijksmuseumApi();
        default:
          throw new Error(`Unknown museum type: ${museumType}`);
      }
    }
  }

  // Export to global scope
  SITE.MuseumApi = MuseumApi;
  SITE.VandAApi = VandAApi;
  SITE.MuseumApiFactory = MuseumApiFactory;
})(this, this.jQuery);

/***/ }),

/***/ "./assets/scripts/x_docReady.js":
/*!**************************************!*\
  !*** ./assets/scripts/x_docReady.js ***!
  \**************************************/
/***/ (function() {

;
(function (window, $) {
  var pumkin = window.pumkin = window.pumkin || {};
  var SITE = window.SITE = window.SITE || {};

  // ON DOC READY
  $(function () {
    console.log("=== DOCUMENT READY HANDLER EXECUTED ===");
    SITE.initGlobal();
    SITE.initMain();

    // Start the V&A API functionality
    SITE.start();
  });
})(this, this.jQuery);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_modules__["./assets/scripts/0_helpers.js"]();
/******/ 	__webpack_modules__["./assets/scripts/1_global.js"]();
/******/ 	__webpack_modules__["./assets/scripts/2_main.js"]();
/******/ 	__webpack_modules__["./assets/scripts/museumApi.js"]();
/******/ 	__webpack_modules__["./assets/scripts/3_va_api.js"]();
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./assets/scripts/x_docReady.js"]();
/******/ 	
/******/ })()
;
//# sourceMappingURL=scripts.js.map