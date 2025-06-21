/**
 * Museum API Abstraction Layer
 * 
 * This module provides a unified interface for different museum APIs.
 * It allows easy switching between V&A, Smithsonian, Rijksmuseum, etc.
 */

(function(window, $) {
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
            this.defaultSearchTerms = [
                "Architecture", "Asia", "British Galleries", "Ceramics", "Childhood", 
                "Contemporary", "Fashion", "Jewellery", "Furniture", "Glass", 
                "Metalwork", "Paintings", "Drawings", "Photography", "Prints", 
                "Books", "Sculpture", "Textiles", "Theatre", "Medieval", "Renaissance",
                "Baroque", "Rococo", "Neoclassical", "Victorian", "Art Nouveau", 
                "Art Deco", "Modernism", "Postmodern", "Islamic", "Chinese", "Japanese",
                "Indian", "African", "American", "European", "Ancient", "Classical",
                "Gothic", "Romanesque", "Byzantine", "Ottoman", "Mughal", "Persian",
                "Egyptian", "Greek", "Roman", "Celtic", "Viking", "Prehistoric",
                "Bronze Age", "Iron Age", "Early Modern", "Industrial Revolution"
            ];
            this.searchTerms = this.defaultSearchTerms;
            this.strictSearch = false;
        }
        
        /**
         * Initialize the V&A API with user settings
         */
        async initialize() {
            return new Promise((resolve) => {
                if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
                    chrome.storage.sync.get({
                        userSearchTerms: "",
                        strictSearch: "fuzzy"
                    }, (items) => {
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
                    }, (response) => {
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
         * Get a random object using V&A API's built-in randomization
         * This is more efficient than the two-step process
         */
        async getRandomObject() {
            this.incrementSearchCount();
            
            if (this.hasExceededMaxAttempts()) {
                throw new Error("Maximum number of search attempts reached");
            }
            
            // Choose a random search term
            const searchTerm = this.chooseSearchTerm();
            console.log("Getting random object for search term:", searchTerm);
            
            return new Promise((resolve, reject) => {
                if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
                    console.log("Sending random object request to background script...");
                    chrome.runtime.sendMessage({
                        action: 'makeVaRequest',
                        params: {
                            searchTerm: searchTerm,
                            offset: null,
                            limit: "1",
                            withImages: "1",
                            withDescription: "1",
                            after: null,
                            random: "1", // Use V&A API's random ordering
                            hasImage: "1"
                        }
                    }, (response) => {
                        console.log("Received random object response:", response);
                        if (response && response.success) {
                            console.log("Random object request successful");
                            resolve(response.data);
                        } else {
                            console.log("Random object request failed:", response ? response.error : "No response");
                            reject(new Error(response ? response.error : "Random object request failed"));
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
            return this.search({ systemNumber: systemNumber });
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
            title = title.replace(/\^/, "")
                        .replace(/\<i\>/g, "")
                        .replace(/\<\\i\>/g, "")
                        .replace(/\<b\>/g, "")
                        .replace(/\<\\b\>/g, "");
            
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
            
            const description = descriptionParts.length > 0 
                ? descriptionParts.join(", ") + "." 
                : "A " + objectInfo.objectType + " from the V&A collection.";
            
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
                sideCaption: "<strong>" + title + " " + (objectInfo._primaryDate || "") + "</strong>" + " &mdash; " + 
                           (objectInfo._primaryMaker && objectInfo._primaryMaker.name ? objectInfo._primaryMaker.name : "") + " " + datesAlive,
                
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