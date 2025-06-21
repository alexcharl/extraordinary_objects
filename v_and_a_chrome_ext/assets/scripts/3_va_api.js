/**
 * V&A API - Refactored Version
 * 
 * This version uses the Museum API abstraction layer while maintaining
 * all existing functionality and compatibility.
 */

(function(window, $, Modernizr) {
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
                chrome.runtime.sendMessage({action: 'test'}, function(response) {
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
        const descriptionContent = objectData.description && objectData.description.trim() !== "" 
            ? objectData.description 
            : "No description available for this object.";
        $("#object-description").html("<p>" + descriptionContent + "</p>");
        $("#object-side-caption").html(objectData.sideCaption);
        
        // Update technical information (hide empty fields)
        updateTechnicalInfo(objectData);
        
        // Trigger resize and mark as loaded
        SITE.onThrottledResize();
        $(".content-placeholder, .hide-until-loaded").addClass("loaded");
        
        // Handle image loading with error fallback
        if (objectData.imageUrl && objectData.imageUrl !== "") {
            $("img.image-hide-until-loaded").on('load', function() {
                $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
                $(this).removeClass("image-error");
            }).on('error', function() {
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
            chrome.storage.local.set({objectHistory: history}, function() {
                console.log('History saved to storage:', history.length, 'items');
            });
        }
    }
    
    // Export functions to maintain compatibility
    SITE.start = start;
    SITE.makeVaRequest = makeVaRequest;
    SITE.processResponse = processResponse;
    
})(this, this.jQuery, this.Modernizr); 