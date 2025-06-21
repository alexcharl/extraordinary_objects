var pumkin = window.pumkin = {};

(function(window, $, Modernizr) {
    function getTransformValues($element, type) {
        var transformMatrix = $element.css("transform");
        var transformValues = transformMatrix.match(/-?[0-9\.]+/g);
        var scale = transformValues[0];
        var translate = {
            x: transformValues[4] / scale,
            y: transformValues[5] / scale
        };
        if (type === "scale") {
            return scale;
        } else if (type === "translate") {
            return translate;
        } else if (type === "raw") {
            return transformValues;
        }
    }
    function checkKey(e) {
        e = e || window.event;
        return e.keyCode;
    }
    function makePlaceholders(els, activeClass) {
        activeClass = activeClass || "active";
        $(els).each(function() {
            var $el = $(this);
            var placeholder = $el.data().placeholder;
            $el.val(placeholder);
            if ($.trim($el.val()) === "") {
                $el.val(placeholder).removeClass(activeClass);
            }
            $el.focus(function() {
                if ($el.val() === placeholder) {
                    $el.val("").addClass(activeClass);
                }
            }).blur(function() {
                if ($.trim($el.val()) === "") {
                    $el.val(placeholder).removeClass(activeClass);
                }
            });
        });
    }
    function svgFallback() {
        $("img[src$='.svg']").each(function() {
            var $el = $(this);
            var origSrc = $el.attr("src");
            var pngSrc = origSrc.replace(".svg", ".png");
            $el.attr("src", pngSrc);
        });
    }
    function normalizeBoxHeights($els) {
        var max = 0;
        $els.each(function() {
            max = Math.max($(this).height(), max);
        });
        $els.each(function() {
            $(this).height(max);
        });
    }
    function randomNum(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    function autoFit($container, $items, margin, doHeightToo, includeLastRow, varyHeight, allSameWidth) {
        console.log("autoFit: " + $items.length);
        margin = margin || 0;
        var containerWidth = $container.width() - margin;
        $items.removeAttr("style");
        var allTheRows = [];
        var rowWidth = 0;
        var thisRow = [];
        $items.each(function() {
            var $this = $(this);
            rowWidth += parseInt($this.css("width")) + margin;
            if (rowWidth <= containerWidth) {
                thisRow.push($this);
            } else {
                allTheRows.push(thisRow);
                thisRow = new Array($this);
                rowWidth = parseInt($this.css("width")) + margin;
            }
            if ($this.is(":last-child") && includeLastRow) {
                allTheRows.push(thisRow);
            }
        });
        var numRows = allTheRows.length;
        for (var r = 0; r < numRows; r++) {
            var itemsInRow = allTheRows[r].length;
            var rowTotalWidth = 0;
            for (var i = 0; i < itemsInRow; i++) {
                rowTotalWidth += parseInt(allTheRows[r][i].css("width")) + margin;
            }
            var remainderWidth = containerWidth - rowTotalWidth;
            var spaceToAdd = remainderWidth / itemsInRow;
            var avgItemWidth = rowTotalWidth / itemsInRow;
            var newRowTotalWidth = 0;
            if (allSameWidth) {
                var theWidth = parseInt(allTheRows[0][0].css("width"));
            }
            for (i = 0; i < itemsInRow; i++) {
                var itemWidth = parseInt(allTheRows[r][i].css("width"));
                var itemRatio = itemWidth / avgItemWidth;
                var newWidth = allSameWidth ? itemWidth + spaceToAdd : itemWidth + Math.floor(spaceToAdd * itemRatio);
                var newHeight;
                if (r === 0 && i === 0) {
                    var itemHeight = parseInt(allTheRows[r][i].css("height"));
                    newHeight = doHeightToo ? Math.floor(newWidth * (itemHeight / itemWidth)) : itemHeight;
                }
                if (varyHeight) {
                    allTheRows[r][i].css({
                        width: newWidth
                    });
                } else {
                    allTheRows[r][i].css({
                        width: newWidth,
                        height: newHeight
                    });
                }
                newRowTotalWidth += newWidth + margin;
            }
            var difference = containerWidth - newRowTotalWidth;
            allTheRows[r][itemsInRow - 1].css("width", parseInt(allTheRows[r][itemsInRow - 1].css("width")) + difference);
        }
    }
    function intelliLoad($imgs, src, revealOnLoad) {
        revealOnLoad = typeof imagesLoaded === "function" ? revealOnLoad : false;
        $imgs.each(function() {
            var $img = $(this);
            var src = src || $img.data("src");
            if (revealOnLoad) {
                $img.css({
                    opacity: 0
                });
            }
            if (!$img.attr("src")) {
                $img.attr("src", src);
                console.log("INTELLILOAD: is image?" + $img.is("img"));
                if (revealOnLoad && $img.is("img")) {
                    console.log("INTELLILOAD: revlealOnLoad: " + src);
                    $img.imagesLoaded().done(function(instance, image) {
                        console.log("INTELLILOAD: imagesLoaded: " + image.attr("src"));
                        image.css({
                            opacity: 1
                        });
                    });
                }
            }
        });
    }
    function defineDeviceVariables() {
        var deviceVariables;
        deviceVariables = {
            isMobile: $("#mobileTester").css("visibility") === "visible" ? true : false,
            isTablet: $("#tabletTester").css("visibility") === "visible" ? true : false,
            isTouch: Modernizr.touch ? true : false
        };
        deviceVariables.isDevice = deviceVariables.isMobile || deviceVariables.isTablet ? true : false;
        return deviceVariables;
    }
    function browserDetection() {
        var browser = {};
        browser.isChrome = navigator.userAgent.indexOf("Chrome") > -1;
        browser.isExplorer = navigator.userAgent.indexOf("MSIE") > -1;
        browser.isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
        browser.isSafari = navigator.userAgent.indexOf("Safari") > -1;
        browser.isOpera = navigator.userAgent.indexOf("Presto") > -1;
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

(function(window, $, Modernizr) {
    var pumkin = window.pumkin;
    var SITE = window.SITE = window.SITE || {};
    function initGlobal() {
        var gv;
        gv = window.gv = {
            $window: $(window),
            $document: $(document),
            $html: $("html"),
            $body: $("body"),
            WIDTH: $(window).width(),
            HEIGHT: $(window).height(),
            deviceVariables: pumkin.defineDeviceVariables(),
            browser: pumkin.browserDetection(),
            $wrapper: $("#wrapper")
        };
        console.log("initGlobal");
    }
    SITE.initGlobal = initGlobal;
})(this, this.jQuery, this.Modernizr);

(function(window, $, Modernizr, screenfull, FastClick) {
    var pumkin = window.pumkin;
    var SITE = window.SITE = window.SITE || {};
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
        $textContent = $(".text-content-column");
        $objectCaption = $(".object-caption");
        $downArrow = $(".down-arrow");
        $objectHeader = $(".object-header");
        $sidePanel = $(".side-panel");
        $sidePanelOpenBtn = $(".more");
        $sidePanelCloseBtn = $(".close-side-panel");
        $historyOpenBtn = $(".history");
        $overlayCloseBtn = $(".close-overlay");
        $overlay = $(".overlay");
        $techInfo = $(".technical-info .text-content");
    }
    function initMain() {
        defineVars();
        initFastclick();
        handleClicks();
        onResize();
        onThrottledResize();
        onDebouncedResize();
        $window.on("resize", onResize);
        $window.on("resize", throttledResize);
        $window.on("resize", debouncedResize);
        onThrottledScroll();
        $textContent.on("scroll", throttledScroll);
        console.log("initMain");
    }
    function handleClicks() {
        $sidePanelOpenBtn.click(function() {
            if ($sidePanel.hasClass("open")) {
                $sidePanel.removeClass("open");
            } else {
                $sidePanel.addClass("open");
            }
        });
        $sidePanelCloseBtn.click(function() {
            $sidePanel.removeClass("open");
        });
        $downArrow.click(function() {
            $(".object-text").velocity("scroll", {
                duration: 700,
                offset: -100,
                easing: "ease-in-out",
                container: $textContent
            });
        });
        $historyOpenBtn.click(function() {
            if ($overlay.hasClass("closed")) {
                $overlay.removeClass("closed").addClass("open for-history");
                showHistory();
                $overlay.fadeIn(500);
            }
        });
        $overlayCloseBtn.click(function() {
            $overlay.fadeOut(500, function() {
                $overlay.removeClass("open for-history for-warning").addClass("closed");
            });
        });
        $(".go-to-options").click(function() {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL("/src/options/index.html"));
            }
        });
    }
    function throwError() {
        $overlay.removeClass("closed").addClass("open for-warning");
        $overlay.fadeIn(500);
    }
    function showHistory() {
        $(".history-wrapper .loading").addClass("loaded");
        getHistory();
    }
    function hideHistory() {
        $("#history-objects").text("");
    }
    function getHistory() {
        var count = 0;
        theHistory.forEach(function(i) {
            var historyObjectHTML = "";
            historyObjectHTML += '<a class="history-object hide-until-loaded" data-object-number="' + i.objectNumber + '" href="' + i.vaCollectionsUrl + '"';
            historyObjectHTML += 'title="View this item in the V&amp;A archive">';
            historyObjectHTML += '<div class="history-object-image-holder" ';
            historyObjectHTML += "style=\"background-image: url('" + i.imageUrl + "');\">";
            historyObjectHTML += "</div>";
            historyObjectHTML += '<img src="' + i.imageUrl + '" class="image-holder-for-loading" id="image-holder-' + count + '" >';
            historyObjectHTML += '<div class="history-object-info">';
            historyObjectHTML += "<p><strong>" + i.title + "</strong>, " + i.date + "</p>";
            historyObjectHTML += "<p>" + i.artist + "</p>";
            historyObjectHTML += "</div>";
            historyObjectHTML += "</a";
            $("#history-objects").append(historyObjectHTML);
            $("#image-holder-" + count).on("load", function() {
                $(this).parent().addClass("loaded");
                $(this).remove();
            });
            count++;
        });
    }
    function onThrottledScroll() {
        var scrollAmt = $textContent.scrollTop();
        if (scrollAmt > HEIGHT * .5) {
            $objectCaption.addClass("reveal");
        } else {
            $objectCaption.removeClass("reveal");
        }
        if (scrollAmt > HEIGHT * .5) {
            $objectHeader.addClass("hide");
        } else {
            $objectHeader.removeClass("hide");
        }
    }
    var throttledScroll = function() {
        onThrottledScroll();
    };
    function onResize() {
        WIDTH = $window.width();
        HEIGHT = $window.height();
    }
    function onThrottledResize() {}
    function onDebouncedResize() {}
    var throttledResize = $.throttle(250, function() {
        onThrottledResize();
    });
    var debouncedResize = $.debounce(100, function() {
        onDebouncedResize();
    });
    function initFastclick() {
        if (typeof FastClick !== "undefined" && FastClick) {
            FastClick.attach(document.body);
        }
    }
    SITE.initMain = initMain;
    SITE.throwError = throwError;
    SITE.onThrottledResize = onThrottledResize;
    SITE.showHistory = showHistory;
    SITE.hideHistory = hideHistory;
})(this, this.jQuery, this.Modernizr, this.screenfull, this.FastClick);

(function(window, $, Modernizr) {
    var pumkin = window.pumkin;
    var SITE = window.SITE = window.SITE || {};
    var vaUrl = "https://api.vam.ac.uk/v2/objects/search";
    var vaMediaUrl = "https://media.vam.ac.uk/media/thira/collection_images/";
    var vaCollectionsUrl = "https://collections.vam.ac.uk/item/";
    var defaultSearchTerms = [ "Architecture", "Asia", "British Galleries", "Ceramics", "Childhood", "Contemporary", "Fashion", "Jewellery", "Furniture", "Glass", "Metalwork", "Paintings", "Drawings", "Photography", "Prints", "Books", "Sculpture", "Textiles", "Theatre" ];
    var theSearchTerms;
    var chosenSearchTerm;
    var strictSearch = false;
    var searchCount = 0;
    var maxSearchCounts = 5;
    function chooseSearchTerm() {
        chosenSearchTerm = theSearchTerms[pumkin.randomNum(0, theSearchTerms.length)];
        console.log("Chosen search term: " + chosenSearchTerm + " from " + theSearchTerms.length + " available terms");
    }
    function start() {
        console.log("=== V&A API START FUNCTION CALLED ===");
        console.log("looking for  user settings");
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
            console.log("Testing background script communication...");
            chrome.runtime.sendMessage({
                action: "test"
            }, function(response) {
                console.log("Background script test response:", response);
            });
        }
        if (typeof chrome != "undefined" && typeof chrome.storage != "undefined") {
            chrome.storage.sync.get({
                userSearchTerms: "",
                strictSearch: "fuzzy"
            }, function(items) {
                if (items.userSearchTerms.length > 0) {
                    console.log("using user search terms: " + items.userSearchTerms);
                    theSearchTerms = items.userSearchTerms.replace(/ /g, "+").split(",");
                } else {
                    console.log("using default search terms: " + defaultSearchTerms);
                    theSearchTerms = defaultSearchTerms;
                }
                console.log("strictSearch setting = " + items.strictSearch);
                if (items.strictSearch == "strict") {
                    strictSearch = true;
                }
                chooseSearchTerm();
                makeVaRequest(null, chosenSearchTerm);
            });
        } else {
            console.log("Running as standalone page, using default search terms: " + defaultSearchTerms);
            theSearchTerms = defaultSearchTerms;
            chooseSearchTerm();
            makeVaRequest(null, chosenSearchTerm);
        }
    }
    function makeVaRequest(systemNumber, searchTerm, offset, limit, withImages, withDescription, after, random) {
        if (searchCount < maxSearchCounts) {
            searchCount++;
            systemNumber = typeof systemNumber !== "undefined" ? systemNumber : null;
            withImages = typeof withImages !== "undefined" ? withImages : "1";
            limit = typeof limit !== "undefined" ? limit : "1";
            searchTerm = typeof searchTerm !== "undefined" ? searchTerm : null;
            offset = typeof offset !== "undefined" ? offset : null;
            withDescription = typeof withDescription !== "undefined" ? withDescription : "1";
            after = typeof after !== "undefined" ? after : null;
            random = typeof random !== "undefined" ? random : "0";
            quality = typeof quality !== "undefined" ? quality : null;
            var expectResponse = 0;
            if (offset != null) {
                expectResponse = 1;
            } else if (systemNumber != null) {
                expectResponse = 2;
            }
            if (strictSearch == true) {
                var searchItem = searchTerm;
                var searchTerm = null;
            } else {
                var searchItem = null;
            }
            console.log("strictSearch = " + strictSearch);
            console.log("expectResponse = " + expectResponse);
            console.log("Chosen term = " + searchTerm);
            console.log("Chosen item name = " + searchItem);
            console.log("offset = " + offset);
            if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
                console.log("Sending message to background script...");
                chrome.runtime.sendMessage({
                    action: "makeVaRequest",
                    params: {
                        systemNumber: systemNumber,
                        searchTerm: searchTerm || searchItem,
                        offset: offset,
                        limit: limit,
                        withImages: withImages,
                        withDescription: withDescription,
                        after: after,
                        random: random
                    }
                }, function(response) {
                    console.log("Received response from background script:", response);
                    if (response && response.success) {
                        console.log("API request successful");
                        processResponse(response.data, expectResponse);
                    } else {
                        console.log("API request failed:", response ? response.error : "No response");
                        chooseSearchTerm();
                        makeVaRequest(null, chosenSearchTerm);
                    }
                });
            } else {
                console.log("Running as standalone page - API requests will fail due to CORS");
                SITE.throwError();
            }
        } else {
            console.log("maximum number of search attempts reached, try changing search terms");
            SITE.throwError();
        }
    }
    function processResponse(data, expectResponse) {
        console.log(data);
        if (expectResponse === 0) {
            var numRecords = data.records.length;
            if (numRecords > 0) {
                var randomOffset = pumkin.randomNum(0, data.info.record_count - 1);
                console.log("total results = " + data.info.record_count);
                console.log("randomOffset range: 0 to " + (data.info.record_count - 1));
                console.log("generated randomOffset = " + randomOffset);
                console.log("making query 2, with randomOffset of " + randomOffset);
                makeVaRequest(null, chosenSearchTerm, randomOffset);
            } else {
                console.log("making a second request, no results found last time");
                chooseSearchTerm();
                makeVaRequest(null, chosenSearchTerm);
            }
            return;
        }
        if (expectResponse === 1) {
            var numRecords = data.records.length;
            console.log("There are " + numRecords + " objects available.");
            var whichObject = data.records[0];
            var systemNumber = whichObject.systemNumber;
            console.log("Selected object system number: " + systemNumber);
            makeVaRequest(systemNumber);
            return;
        }
        if (!data.records || data.records.length === 0) {
            console.log("No object found for system number, trying a different search term");
            chooseSearchTerm();
            makeVaRequest(null, chosenSearchTerm);
            return;
        }
        var objectInfo = data.records[0];
        console.log("Processing object data:", objectInfo);
        var imageId = objectInfo._primaryImageId;
        var theObject = objectInfo.objectType;
        var theTitle = objectInfo._primaryTitle != "" ? objectInfo._primaryTitle : objectInfo.objectType;
        var theDate = objectInfo._primaryDate;
        var theSlug = objectInfo.systemNumber;
        var theArtist = objectInfo._primaryMaker && objectInfo._primaryMaker.name ? objectInfo._primaryMaker.name : "";
        var theSystemNumber = objectInfo.systemNumber;
        var theMaterials = "";
        var theDescription = "";
        var theContext = "";
        console.log("Extracted data - Title:", theTitle, "Artist:", theArtist, "System Number:", theSystemNumber);
        var datesAlive = "";
        if (objectInfo._primaryMaker && objectInfo._primaryMaker.birthYear) {
            var birthYear = objectInfo._primaryMaker.birthYear;
            var deathYear = objectInfo._primaryMaker.deathYear;
            if (birthYear && deathYear) {
                datesAlive = "(" + birthYear + " - " + deathYear + ")";
            } else if (birthYear) {
                datesAlive = "(Born " + birthYear + ")";
            }
        }
        var imgUrl = "https://framemark.vam.ac.uk/collections/" + imageId + "/full/1000,/0/default.jpg";
        var objectUrl = vaCollectionsUrl + theSystemNumber + "/" + theSlug;
        var thePhysicalDescription = "";
        var theDimensions = "";
        var thePlace = objectInfo._primaryPlace;
        var theMuseumNumber = objectInfo.accessionNumber;
        var theMuseumLocation = objectInfo._currentLocation ? objectInfo._currentLocation.displayName : "";
        theTitle = theTitle.replace(/\^/, "");
        theTitle = theTitle.replace(/\<i\>/g, "");
        theTitle = theTitle.replace(/\<\\i\>/g, "");
        theTitle = theTitle.replace(/\<b\>/g, "");
        theTitle = theTitle.replace(/\<\\b\>/g, "");
        var theSideCaption = "<strong>" + theTitle + " " + theDate + "</strong>" + " &mdash; " + theArtist + " " + datesAlive;
        var descriptionParts = [];
        if (theTitle && theTitle !== theObject) {
            descriptionParts.push(theTitle);
        }
        if (theDate) {
            descriptionParts.push("Dated " + theDate);
        }
        if (thePlace) {
            descriptionParts.push("from " + thePlace);
        }
        if (theArtist && theArtist !== "Unknown") {
            descriptionParts.push("by " + theArtist);
        }
        var theDescription = descriptionParts.length > 0 ? descriptionParts.join(", ") + "." : "A " + theObject + " from the V&A collection.";
        theDescription = theDescription.replace(/Object Type\n/g, "");
        theDescription = theDescription.replace(/People\n/g, "");
        theDescription = theDescription.replace(/Place\n/g, "");
        theDescription = theDescription.replace(/Places\n/g, "");
        theDescription = theDescription.replace(/Time\n/g, "");
        theDescription = theDescription.replace(/Design \& Designing\n/g, "");
        theDescription = theDescription.replace(/Design\n/g, "");
        theDescription = theDescription.replace(/Subject Depicted\n/g, "");
        theDescription = theDescription.replace(/Subjects Depicted\n/g, "");
        theDescription = theDescription.replace(/Materials \& Making\n/g, "");
        theDescription = theDescription.replace(/Collectors \& Owners\n/g, "");
        theDescription = theDescription.replace(/Ownership \& Use\n/g, "");
        theDescription = theDescription.replace(/Trading\n/g, "");
        theDescription = theDescription.replace(/Trade\n/g, "");
        theDescription = theDescription.replace(/Historical Associations\n/g, "");
        theDescription = theDescription.replace(/Other\n/g, "");
        theDescription = theDescription.replace(/\n\n\n/g, "\n\n");
        theDescription = theDescription.replace(/\n/g, "<br>");
        theDescription = theDescription.replace(/\<i\>/g, "");
        theDescription = theDescription.replace(/\<\\i\>/g, "");
        theDescription = theDescription.replace(/\<b\>/g, "");
        theDescription = theDescription.replace(/\<\\b\>/g, "");
        thePhysicalDescription = thePhysicalDescription.replace(/\<i\>/g, "");
        thePhysicalDescription = thePhysicalDescription.replace(/\<\\i\>/g, "");
        thePhysicalDescription = thePhysicalDescription.replace(/\<b\>/g, "");
        thePhysicalDescription = thePhysicalDescription.replace(/\<\\b\>/g, "");
        theDate = typeof theDate !== "undefined" && theDate != null ? theDate : "";
        var pinterestUrl = "https://www.pinterest.com/pin/create/button/";
        pinterestUrl += "?url=" + objectUrl;
        pinterestUrl += "&media=" + imgUrl;
        pinterestUrl += "&description=" + theTitle;
        if (theDate != "") pinterestUrl += " (" + thePlace + ", " + theDate + ")";
        pinterestUrl += ", V%26A Collection";
        if (theTitle.length > 42) {
            $("#title").addClass("reduced");
            $("#piece-date").addClass("reduced");
        }
        $("#creator-name").text(theArtist);
        $("#dates-alive").text(datesAlive);
        $("#title").html(theTitle);
        if (theDate != "") $("#piece-date").text("(" + theDate + ")");
        $("#place").html(thePlace);
        $("#image").attr("src", imgUrl);
        $("#pinterest-button").attr("href", pinterestUrl);
        $("#page-link").attr("href", objectUrl);
        console.log("UI Updates - Setting title to:", theTitle);
        console.log("UI Updates - Setting artist to:", theArtist);
        console.log("UI Updates - Setting image to:", imgUrl);
        var descriptionContent = theDescription && theDescription.trim() !== "" ? theDescription : "No description available for this object.";
        $("#object-description").html("<p>" + descriptionContent + "</p>");
        $("#object-context").html("<p>" + theContext + "</p>");
        $("#object-side-caption").html(theSideCaption);
        if (thePhysicalDescription != "") {
            $("#physical-description").html(thePhysicalDescription);
        } else {
            console.log("hiding physical description");
            $("#physical-description").hide();
            $("#physical-description").prev("h4").hide();
        }
        if (theDate != "") {
            $("#tech-info-piece-date").text(theDate);
        } else {
            $("#tech-info-piece-date").hide();
            $("#tech-info-piece-date").prev("h4").hide();
        }
        if (theArtist != "") {
            $("#tech-info-creator-name").text(theArtist);
        } else {
            $("#tech-info-creator-name").hide();
            $("#tech-info-creator-name").prev("h4").hide();
        }
        if (theMaterials != "") {
            $("#tech-info-materials").html(theMaterials);
        } else {
            $("#tech-info-materials").hide();
            $("#tech-info-materials").prev("h4").hide();
        }
        if (thePlace != "") {
            $("#tech-info-place").text(thePlace);
        } else {
            $("#tech-info-place").hide();
            $("#tech-info-place").prev("h4").hide();
        }
        if (theDimensions != "") {
            $("#dimensions").text(theDimensions);
        } else {
            $("#dimensions").hide();
            $("#dimensions").prev("h4").hide();
        }
        if (theMuseumLocation != "") {
            $("#museum-location").text(theMuseumLocation);
        } else {
            $("#museum-location").hide();
            $("#museum-location").prev("h4").hide();
        }
        if (theMuseumNumber != "") {
            $("#museum-number").text(theMuseumNumber);
        } else {
            $("#museum-number").hide();
            $("#museum-number").prev("h4").hide();
        }
        SITE.onThrottledResize();
        $(".content-placeholder, .hide-until-loaded").addClass("loaded");
        $("img.image-hide-until-loaded").load(function() {
            $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
        });
    }
    SITE.start = start;
    SITE.makeVaRequest = makeVaRequest;
    SITE.processResponse = processResponse;
})(this, this.jQuery, this.Modernizr);

(function(window, $) {
    var pumkin = window.pumkin = window.pumkin || {};
    var SITE = window.SITE = window.SITE || {};
    $(function() {
        console.log("=== DOCUMENT READY HANDLER EXECUTED ===");
        SITE.initGlobal();
        SITE.initMain();
        SITE.start();
    });
})(this, this.jQuery);
//# sourceMappingURL=scripts.js.map