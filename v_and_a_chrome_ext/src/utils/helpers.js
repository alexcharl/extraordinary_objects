/**
 * Utility functions for the V&A Chrome Extension
 * Refactored from 0_helpers.js with ES6 module structure
 */

// Global pumkin object for backward compatibility
window.pumkin = window.pumkin || {};

/**
 * Get transform values from CSS transform matrix
 */
export function getTransformValues($element, type) {
  const transformMatrix = $element.css('transform');
  const transformValues = transformMatrix.match(/-?[0-9\.]+/g);
  const scale = transformValues[0];

  const translate = {
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

/**
 * Check key code from event
 */
export function checkKey(e) {
  e = e || window.event;
  return e.keyCode;
}

/**
 * Create placeholder functionality for form elements
 */
export function makePlaceholders(els, activeClass) {
  activeClass = activeClass || 'active';

  $(els).each(function() {
    const $el = $(this);
    const placeholder = $el.data().placeholder;

    $el.val(placeholder);
    
    if ($.trim($el.val()) === '') {
      $el.val(placeholder).removeClass(activeClass);
    }
    
    $el.focus(function() {
      if ($el.val() === placeholder) {
        $el.val('').addClass(activeClass);
      }
    }).blur(function() {
      if ($.trim($el.val()) === '') {
        $el.val(placeholder).removeClass(activeClass);
      }
    });
  });
}

/**
 * SVG fallback for older browsers
 */
export function svgFallback() {
  $("img[src$='.svg']").each(function () {
    const $el = $(this);
    const origSrc = $el.attr('src');
    const pngSrc = origSrc.replace('.svg','.png');
    $el.attr('src', pngSrc);
  });
}

/**
 * Normalize box heights to match the tallest element
 */
export function normalizeBoxHeights($els) {
  let max = 0;

  // get all the element heights and find the tallest
  $els.each(function() {
    max = Math.max($(this).height(), max);
  });

  // set them all to the height of the tallest
  $els.each(function() {
    $(this).height(max);
  });
}

/**
 * Generate random number between min and max
 */
export function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Auto-fit items in a container with flexible layout
 */
export function autoFit($container, $items, margin, doHeightToo, includeLastRow, varyHeight, allSameWidth) {
  console.log('autoFit: ' + $items.length);

  margin = margin || 0;

  // check if we've covered the whole area with tiles
  // if we fall short, expand the tiles to meet the edge of the container
  // currently only works width-ways

  const containerWidth = $container.width() - margin;

  // reset the items to their regular (css-defined) width by removing style attributes
  $items.removeAttr('style');

  // create a master array which will hold the rows
  const allTheRows = [];

  // start a rowWidth variable to measure the combined width of items in each row
  let rowWidth = 0;

  // start an array for items in the current row
  let thisRow = [];

  // now loop through, we create a new array for each row then add it to the master
  $items.each(function() {
    // start adding up the widths until we can't fit another one in
    const $this = $(this);
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
  const numRows = allTheRows.length;

  for (let r = 0; r < numRows; r++) {
    const itemsInRow = allTheRows[r].length;

    // track the row width
    let rowTotalWidth = 0;

    for (let i = 0; i < itemsInRow; i++) {
      rowTotalWidth += parseInt(allTheRows[r][i].css('width')) + margin;
    }

    // what's the amount of remaining width for this row?
    const remainderWidth = (containerWidth - rowTotalWidth);

    // width available to add to each item
    const spaceToAdd = (remainderWidth / itemsInRow);

    // get the average item width
    const avgItemWidth = (rowTotalWidth / itemsInRow);

    // track the new row width, we use to adjust if rounding errors prevent perfect alignment
    let newRowTotalWidth = 0;

    // in progress...
    if (allSameWidth) {
      const theWidth = parseInt(allTheRows[0][0].css('width'));
    }

    // now loop again and add space according to 
    // the proportion of each item vs. the average item width
    for (let i = 0; i < itemsInRow; i++) {
      const itemWidth = parseInt(allTheRows[r][i].css('width'));
      const itemRatio = itemWidth / avgItemWidth;
      const newWidth = allSameWidth ? itemWidth + spaceToAdd : itemWidth + Math.floor(spaceToAdd * itemRatio);
      let newHeight;

      // get the new height from the first element then apply to all the others
      if (r === 0 && i === 0) {
        const itemHeight = parseInt(allTheRows[r][i].css('height'));

        // set the new height to keep proportions (if option is true)
        newHeight = doHeightToo ? Math.floor(newWidth * (itemHeight / itemWidth)) : itemHeight;
      }

      // apply the new dimensions
      allTheRows[r][i].css({
        width: newWidth + 'px',
        height: newHeight + 'px'
      });

      newRowTotalWidth += newWidth + margin;
    }
  }
}

/**
 * Intelligent image loading with fallback
 */
export function intelliLoad($imgs, src, revealOnLoad) {
  revealOnLoad = revealOnLoad || false;

  $imgs.each(function() {
    const $img = $(this);
    const imgSrc = src || $img.attr('src');

    if (imgSrc) {
      const newImg = new Image();
      
      newImg.onload = function() {
        $img.attr('src', imgSrc);
        if (revealOnLoad) {
          $img.addClass('loaded');
        }
      };

      newImg.onerror = function() {
        console.warn('Failed to load image:', imgSrc);
      };

      newImg.src = imgSrc;
    }
  });
}

/**
 * Define device variables for responsive design
 */
export function defineDeviceVariables() {
  const $mobileTester = $('#mobileTester');
  const $tabletTester = $('#tabletTester');
  const $gutterTester = $('#gutter-tester');

  return {
    isMobile: $mobileTester.is(':visible'),
    isTablet: $tabletTester.is(':visible'),
    isDevice: $mobileTester.is(':visible') || $tabletTester.is(':visible'),
    isTouch: 'ontouchstart' in window,
    gutter: $gutterTester.is(':visible')
  };
}

/**
 * Browser detection
 */
export function browserDetection() {
  const userAgent = navigator.userAgent;
  let browser = 'unknown';

  if (userAgent.indexOf('Chrome') > -1) {
    browser = 'chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'safari';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browser = 'firefox';
  } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) {
    browser = 'ie';
  }

  return browser;
}

// Export all functions to the global pumkin object for backward compatibility
window.pumkin = {
  getTransformValues,
  checkKey,
  makePlaceholders,
  svgFallback,
  normalizeBoxHeights,
  randomNum,
  autoFit,
  intelliLoad,
  defineDeviceVariables,
  browserDetection
}; 