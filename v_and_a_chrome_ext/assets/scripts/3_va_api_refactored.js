/**
 * V&A API - Refactored Version with State Management
 * 
 * This version uses the state management system for better data flow
 * and component communication. It replaces direct component calls with
 * state-based updates.
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
            
            // Set up keyboard shortcuts
            setupKeyboardShortcuts();
            
            // Use the new random object method for better randomization
            await getRandomObject();
            
        } catch (error) {
            console.error("Failed to initialize museum API:", error);
            SITE.throwError();
        }
    }
    
    /**
     * Set up keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(event) {
            // Spacebar to get new random object
            if (event.code === 'Space' && !event.target.matches('input, textarea, select')) {
                event.preventDefault();
                console.log('Spacebar pressed - getting new random object');
                getRandomObject();
            }
        });
        
        // Add click handler to image area for new random object
        document.addEventListener('click', function(event) {
            // Check if click is on the image area (but not on buttons or links)
            if (event.target.closest('.object-image-wrapper') && 
                !event.target.closest('.share-icons') && 
                !event.target.closest('a') && 
                !event.target.closest('button')) {
                console.log('Image area clicked - getting new random object');
                getRandomObject();
            }
        });
        
        console.log('Keyboard shortcuts enabled: Press SPACEBAR for new random object');
        console.log('Click on image area for new random object');
    }
    
    /**
     * Get a random object using the new efficient method
     */
    async function getRandomObject() {
        try {
            console.log("Getting random object using V&A API randomization...");
            
            // Use the new getRandomObject method
            const data = await museumApi.getRandomObject();
            
            // Process the response directly (no need for expectResponse logic)
            await processRandomObjectResponse(data);
            
        } catch (error) {
            console.error("Random object request failed:", error);
            
            if (museumApi.hasExceededMaxAttempts()) {
                console.log("maximum number of search attempts reached, try changing search terms");
                SITE.throwError();
            } else {
                // Retry with a different random object
                await getRandomObject();
            }
        }
    }
    
    /**
     * Process random object response
     */
    async function processRandomObjectResponse(data) {
        console.log("Processing random object response:", data);
        
        // Process individual object data
        if (!data.records || data.records.length === 0) {
            console.log("No random object found, trying again");
            await getRandomObject();
            return;
        }
        
        // Process the object data using the abstraction layer
        const objectData = museumApi.processObjectData(data);
        
        // Update the state with the new object data
        await updateStateWithObjectData(objectData);
        
        // Save to history
        await saveToHistoryWithState(objectData);
    }
    
    /**
     * Global function to get a new random object (can be called from other components)
     */
    window.getNewRandomObject = function() {
        console.log('getNewRandomObject called');
        getRandomObject();
    };
    
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
        
        // Update the state with the new object data
        await updateStateWithObjectData(objectData);
        
        // Save to history if this is a final object (not a search step)
        if (expectResponse !== 0 && expectResponse !== 1) {
            await saveToHistoryWithState(objectData);
        }
    }
    
    /**
     * Update state with object data using state management
     */
    async function updateStateWithObjectData(objectData) {
        console.log("Updating state with object data:", objectData);
        
        try {
            // Use state management to update the object
            if (window.appState) {
                // Update current object
                window.appState.dispatch(objectActions.setCurrentObject(objectData));
                
                // Clear any previous errors
                window.appState.dispatch(errorActions.clearError());
                
                console.log("State updated successfully with object data");
            } else {
                // Fallback to direct component updates if state management not available
                console.warn("State management not available, using fallback");
                updateUIFallback(objectData);
            }
        } catch (error) {
            console.error("Error updating state with object data:", error);
            // Fallback to direct component updates
            updateUIFallback(objectData);
        }
    }
    
    /**
     * Save to history using state management
     */
    async function saveToHistoryWithState(objectData) {
        try {
            if (window.appState) {
                window.appState.dispatch(historyActions.addToHistory(objectData));
            } else {
                // Fallback to direct history management
                console.warn("State management not available, using fallback history");
                saveToHistoryFallback(objectData);
            }
        } catch (error) {
            console.error("Error saving to history with state:", error);
            // Fallback to direct history management
            saveToHistoryFallback(objectData);
        }
    }
    
    /**
     * Fallback UI update using direct DOM manipulation
     */
    function updateUIFallback(objectData) {
        console.log("Using fallback UI update");
        
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
        
        // Update Twitter URL
        let twitterUrl = "https://twitter.com/intent/tweet";
        twitterUrl += "?text=" + encodeURIComponent(objectData.title);
        if (objectData.date !== "") {
            twitterUrl += encodeURIComponent(" (" + objectData.place + ", " + objectData.date + ")");
        }
        twitterUrl += encodeURIComponent(", V&A Collection ");
        twitterUrl += encodeURIComponent(objectData.objectUrl);
        $("#twitter-button").attr("href", twitterUrl);
        
        // Update descriptions
        if (objectData.description && objectData.description !== "") {
            $("#object-description").html("<p>" + objectData.description + "</p>");
        }
        
        if (objectData.context && objectData.context !== "") {
            $("#object-context").html("<p>" + objectData.context + "</p>");
        }
        
        // Update technical information
        updateTechnicalInfoFallback(objectData);
    }
    
    /**
     * Update technical information using fallback method
     */
    function updateTechnicalInfoFallback(objectData) {
        function hideIfEmpty(selector, value) {
            if (value && value !== "") {
                $(selector).text(value);
                $(selector).closest('section').show();
            } else {
                $(selector).closest('section').hide();
            }
        }
        
        hideIfEmpty("#physical-description", objectData.physicalDescription);
        hideIfEmpty("#tech-info-place", objectData.place);
        hideIfEmpty("#tech-info-piece-date", objectData.date);
        hideIfEmpty("#tech-info-creator-name", objectData.artist);
        hideIfEmpty("#tech-info-materials", objectData.materials);
        hideIfEmpty("#dimensions", objectData.dimensions);
        hideIfEmpty("#museum-location", objectData.museumLocation);
        hideIfEmpty("#museum-number", objectData.objectNumber);
    }
    
    /**
     * Fallback history saving using direct DOM manipulation
     */
    function saveToHistoryFallback(objectData) {
        console.log("Using fallback history saving");
        
        // This would be the original history saving logic
        // For now, we'll just log that we're using fallback
        console.log("Fallback history save for object:", objectData.title);
    }
    
    /**
     * Show loading state using state management
     */
    function showLoading() {
        if (window.appState) {
            window.appState.dispatch(loadingActions.startLoading());
        }
    }
    
    /**
     * Hide loading state using state management
     */
    function hideLoading() {
        if (window.appState) {
            window.appState.dispatch(loadingActions.stopLoading());
        }
    }
    
    /**
     * Show error using state management
     */
    function showError(error) {
        if (window.appState) {
            window.appState.dispatch(errorActions.setError(error));
            window.appState.dispatch(uiActions.openErrorOverlay());
        } else {
            // Fallback error handling
            SITE.throwError();
        }
    }
    
    // Public API
    // ----------------------------------------------------
    
    // Expose functions to global scope
    SITE.start = start;
    SITE.makeVaRequest = makeVaRequest;
    SITE.processResponse = processResponse;
    SITE.showLoading = showLoading;
    SITE.hideLoading = hideLoading;
    SITE.showError = showError;
    
    // Initialize when called
    if (typeof SITE.initMain !== 'undefined') {
        // Wait for main initialization to complete
        const checkInit = setInterval(() => {
            if (window.componentManager && window.componentManager.isReady()) {
                clearInterval(checkInit);
                console.log("V&A API ready to start");
            }
        }, 100);
    }
    
})(window, jQuery, Modernizr); 