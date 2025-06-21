var pumkin = window.pumkin = {};
// GLOBAL VARIABLES

// change this depending on the site

(function ( window, $, Modernizr ) {

  function getTransformValues ($element , type) {
    var transformMatrix = $element.css('transform');
    var transformValues = transformMatrix.match(/-?[0-9\.]+/g);
    var scale = transformValues[0];

    var translate = {
      x: transformValues[4] / scale,
      y: transformValues[5] / scale
    };

    if (type === 'scale') {
      return scale;
    }

    else if (type === 'translate') {
      return translate;
    }

    else if (type === 'raw') {
      return transformValues;
    }
  }

  function checkKey(e) {

      e = e || window.event;

      return e.keyCode;
  }

  function makePlaceholders (els, activeClass) {
    
    activeClass = activeClass || 'active';

    $(els).each(function() {
      
      var $el = $(this);
      var placeholder = $el.data().placeholder;

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



  function svgFallback () {
    $("img[src$='.svg']").each(function () {
      var $el = $(this);
      var origSrc = $el.attr('src');
      var pngSrc = origSrc.replace('.svg','.png');
      $el.attr('src',pngSrc);
    });
  }

  function normalizeBoxHeights($els) {

    var max = 0;

    // get all the element heights and find the tallest
    $els.each(function() {
      max = Math.max($(this).height(), max);
    });

    // set them all to the height of the tallest
    $els.each(function() {
      $(this).height(max);
    });
  }

  function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }


  function autoFit($container, $items, margin, doHeightToo, includeLastRow, varyHeight, allSameWidth) {

      console.log('autoFit: '+$items.length);

      margin = margin || 0;

      // check if we've covered the whole area with tiles
      // if we fall short, expand the tiles to meet the edge of the container
      // currently only works width-ways

      var containerWidth = $container.width()-margin;

      // reset the items to their regular (css-defined) width by removing style attributs
      $items.removeAttr('style');

      // create a master array which will hold the rows
      var allTheRows = [];

      // start a rowWidth variable to measure the combined width of items in each row
      var rowWidth = 0;

      // start an array for items in the current row
      var thisRow = [];

      // now loop through, we create a new array for each row then add it to the master
      $items.each(function() {

        // start adding up the widths until we can't fit another one in
        var $this = $(this);
        rowWidth+=parseInt($this.css('width'))+margin;

        if (rowWidth<=containerWidth) {

            // add this item to the row array
            thisRow.push($this);
        
        } else {

            // add the row to the master array ...
            allTheRows.push(thisRow);

            // ... then start a new row array with this item in it
            thisRow = new Array($this);

            // and reset the rowWidth
            rowWidth = parseInt($this.css('width'))+margin;
        }

        if ($this.is(':last-child') && includeLastRow) {

          // add the final row to the master array ...
          allTheRows.push(thisRow);
        }
      });

      // now loop through the whole array and fit each one
      var numRows = allTheRows.length;

      for (var r=0; r<numRows; r++) {

        var itemsInRow = allTheRows[r].length;

        // track the row width
        var rowTotalWidth = 0;

        for (var i=0; i<itemsInRow; i++) {

          rowTotalWidth+=parseInt(allTheRows[r][i].css('width'))+margin;
        }

        // what's the amount of remaining width for this row?
        var remainderWidth = (containerWidth-rowTotalWidth);

        // width available to add to each item
        var spaceToAdd = (remainderWidth / itemsInRow);

        // get the average item width
        var avgItemWidth = (rowTotalWidth / itemsInRow);

        // track the new row width, we use to adjust if rounding errors prevent perfect alignment
        var newRowTotalWidth = 0;

        // in progress...
        if (allSameWidth) {

          var theWidth = parseInt(allTheRows[0][0].css('width'));
        }

        // now loop again and add add space according to 
        // the proportion of each item vs. the average item width
        for ( i=0; i<itemsInRow; i++) {

          var itemWidth = parseInt(allTheRows[r][i].css('width'));
          var itemRatio = itemWidth / avgItemWidth;
          var newWidth = allSameWidth ? itemWidth + spaceToAdd : itemWidth+Math.floor(spaceToAdd*itemRatio);
          var newHeight;

          // get the new height from the first element then apply to all the others
          if ( r === 0 && i === 0) {
            
            var itemHeight = parseInt(allTheRows[r][i].css('height'));

            // set the new height to keep proportions (if option is true)
            newHeight = doHeightToo ? Math.floor(newWidth*(itemHeight/itemWidth)) : itemHeight;
          }
          
          if (varyHeight) {
            allTheRows[r][i].css({
              'width' : newWidth
            });
          } 
          else {
            allTheRows[r][i].css({
              'width' : newWidth,
              'height' : newHeight
            });
          }

          newRowTotalWidth += newWidth+margin;
        }

        // add or subtract any rounding error difference
        var difference = containerWidth-newRowTotalWidth;
        allTheRows[r][itemsInRow-1].css('width', parseInt(allTheRows[r][itemsInRow-1].css('width'))+difference);
      }
    }


  function intelliLoad( $imgs, src, revealOnLoad ) {

    // check if we have a library available (desandro's imagesLoaded) to listen for image load
    // if not, don't do revealOnLoad
    revealOnLoad = typeof imagesLoaded === "function" ? revealOnLoad : false;

    $imgs.each(function() {

      var $img = $(this);
      // under normal usage there'd be an image tag but no src attr
      // image source is held in data-src
      // can be overridden by passing src param if required
      var src = src || $img.data( 'src' );

      if (revealOnLoad) { $img.css({ 'opacity': 0 }); }

      if (!$img.attr('src')) {

        $img.attr('src', src);

        console.log('INTELLILOAD: is image?'+$img.is('img'));

        if ( revealOnLoad && $img.is('img') ) {
          console.log('INTELLILOAD: revlealOnLoad: '+src);
          $img.imagesLoaded()
            .done( function( instance, image ) {
              console.log('INTELLILOAD: imagesLoaded: '+image.attr('src'));
              image.css({ 'opacity': 1 }); // no animation via js - add a transition in css if you want
            });
        }
      }

    });
  }


  function defineDeviceVariables () {
      var deviceVariables;
      deviceVariables = {
        isMobile: $('#mobileTester').css('visibility') === 'visible' ? true : false,
        isTablet: $('#tabletTester').css('visibility') === 'visible' ? true : false,
        isTouch: Modernizr.touch ? true : false
      };
      deviceVariables.isDevice = deviceVariables.isMobile || deviceVariables.isTablet ? true : false;
      return deviceVariables;
    }

  function browserDetection () {

    var browser = {};

    browser.isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    browser.isExplorer = navigator.userAgent.indexOf('MSIE') > -1;
    browser.isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    browser.isSafari = navigator.userAgent.indexOf('Safari') > -1;
    browser.isOpera = navigator.userAgent.indexOf('Presto') > -1;

    if ( (browser.isChrome) && (browser.isSafari) ) {
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

})( this, this.jQuery, this.Modernizr );