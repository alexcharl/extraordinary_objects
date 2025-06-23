/**
 * V&A Museum API implementation
 * Extends MuseumApi base class for V&A-specific functionality
 */

import { MuseumApi } from './MuseumApi.js';
import { randomNum } from '../utils/helpers.js';

export class VandAApi extends MuseumApi {
  constructor() {
    super({
      baseUrl: 'https://api.vam.ac.uk/v2',
      searchEndpoint: '/objects/search',
      objectEndpoint: '/objects',
      mediaUrl: 'https://media.vam.ac.uk/media/thira/collection_images/',
      collectionsUrl: 'https://collections.vam.ac.uk/item/'
    });
    
    this.defaultSearchTerms = [
      "Architecture", "Asia", "British Galleries", "Ceramics", "Childhood", 
      "Contemporary", "Fashion", "Jewellery", "Furniture", "Glass", 
      "Metalwork", "Paintings", "Drawings", "Photography", "Prints", 
      "Books", "Sculpture", "Textiles", "Theatre"
    ];
    
    this.strictSearch = false;
  }

  /**
   * Initialize with V&A-specific settings
   */
  async init(searchTerms = null, strictSearch = false) {
    this.strictSearch = strictSearch;
    
    if (!searchTerms || searchTerms.length === 0) {
      searchTerms = this.defaultSearchTerms;
    }
    
    await super.init(searchTerms);
    
    // Display search terms in the side panel
    const searchTermsDisplay = this.searchTerms.join(", ");
    $("#search-terms").text(searchTermsDisplay);
  }

  /**
   * Make HTTP request using background script to bypass CORS
   */
  async makeRequest(url, options = {}) {
    // Extract parameters from URL for background script
    const urlObj = new URL(url);
    const params = {};
    
    // Parse URL parameters
    for (const [key, value] of urlObj.searchParams) {
      params[key] = value;
    }
    
    // Determine request type based on parameters
    const systemNumber = params.kw_system_number || null;
    const searchTerm = params.q || null;
    const offset = params.page ? (parseInt(params.page) - 1) * parseInt(params.page_size || '1') : null;
    const limit = params.page_size || '1';
    const withImages = '1';
    const withDescription = '1';
    const hasImage = '1';
    
    return new Promise((resolve, reject) => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        console.log("Sending message to background script...");
        chrome.runtime.sendMessage({
          action: 'makeVaRequest',
          params: {
            systemNumber: systemNumber,
            searchTerm: searchTerm,
            offset: offset,
            limit: limit,
            withImages: withImages,
            withDescription: withDescription,
            hasImage: hasImage
          }
        }, function(response) {
          console.log("Received response from background script:", response);
          if (response && response.success) {
            console.log("API request successful");
            resolve(response.data);
          } else {
            console.log("API request failed:", response ? response.error : "No response");
            reject(new Error(response ? response.error : "No response from background script"));
          }
        });
      } else {
        // Fallback for standalone testing (won't work due to CORS)
        console.log("Running as standalone page - API requests will fail due to CORS");
        reject(new Error("Chrome extension context not available"));
      }
    });
  }

  /**
   * Search for objects in V&A collection
   */
  async searchObjects(searchTerm, options = {}) {
    if (!this.canSearch()) {
      throw new Error('Maximum search attempts reached');
    }

    this.incrementSearchCount();
    
    const params = new URLSearchParams({
      q: searchTerm || this.getRandomSearchTerm(),
      page_size: options.limit || '1',
      page: '1'
    });

    const url = `${this.config.baseUrl}${this.config.searchEndpoint}?${params}`;
    
    try {
      const data = await this.makeRequest(url);
      return this.normalizeSearchResults(data);
    } catch (error) {
      console.error('V&A search failed:', error);
      throw error;
    }
  }

  /**
   * Get a random object from V&A collection
   */
  async getRandomObject(searchTerm = null, options = {}) {
    try {
      // First, search to get total count
      const searchResults = await this.searchObjects(searchTerm, { limit: '1' });
      
      if (!searchResults.totalCount || searchResults.totalCount === 0) {
        throw new Error('No objects found for search term');
      }

      // Get random offset
      const randomOffset = randomNum(0, searchResults.totalCount - 1);
      
      // Search with random offset
      const randomResults = await this.searchObjects(searchTerm, {
        ...options,
        limit: '1',
        offset: randomOffset
      });

      if (randomResults.objects.length === 0) {
        throw new Error('No object found at random offset');
      }

      // Get the specific object
      const objectId = randomResults.objects[0].id;
      return await this.getObject(objectId, options);
      
    } catch (error) {
      console.error('Failed to get random object:', error);
      throw error;
    }
  }

  /**
   * Get a specific object by system number
   */
  async getObject(systemNumber, options = {}) {
    const params = new URLSearchParams({
      kw_system_number: systemNumber,
      page_size: '1',
      page: '1'
    });

    const url = `${this.config.baseUrl}${this.config.searchEndpoint}?${params}`;
    
    try {
      const data = await this.makeRequest(url);
      return this.normalizeObjectData(data);
    } catch (error) {
      console.error('Failed to get object:', error);
      throw error;
    }
  }

  /**
   * Normalize V&A search results
   */
  normalizeSearchResults(data) {
    return {
      totalCount: data.info?.record_count || 0,
      objects: data.records?.map(record => this.normalizeObjectData({ records: [record] })) || [],
      info: data.info
    };
  }

  /**
   * Normalize V&A object data to common format
   */
  normalizeObjectData(data) {
    if (!data.records || data.records.length === 0) {
      throw new Error('No object data found');
    }

    const objectInfo = data.records[0];
    
    // Construct IIIF URL for larger image (2500px max for best quality)
    let imageUrl = '';
    if (objectInfo._primaryImageId) {
      imageUrl = `https://framemark.vam.ac.uk/collections/${objectInfo._primaryImageId}/full/2500,/0/default.jpg`;
    }
    
    return {
      id: objectInfo.systemNumber,
      title: objectInfo._primaryTitle || 'Untitled',
      description: objectInfo._primaryDescription || '',
      date: objectInfo._primaryDate || '',
      maker: objectInfo._primaryMaker?.name || '',
      makerAssociation: objectInfo._primaryMaker?.association || '',
      place: objectInfo._primaryPlace || '',
      objectType: objectInfo.objectType || '',
      accessionNumber: objectInfo.accessionNumber || '',
      currentLocation: objectInfo._currentLocation?.displayName || '',
      onDisplay: objectInfo._currentLocation?.onDisplay || false,
      
      // Image data - use high-quality IIIF URL instead of thumbnail
      imageId: objectInfo._primaryImageId,
      imageUrl: imageUrl, // New field for the actual image URL
      thumbnailUrl: objectInfo._images?._primary_thumbnail || '',
      imageBaseUrl: objectInfo._images?._iiif_image_base_url || '',
      manifestUrl: objectInfo._images?._iiif_presentation_url || '',
      
      // V&A-specific URLs
      collectionUrl: `${this.config.collectionsUrl}${objectInfo.systemNumber}`,
      
      // Raw data for backward compatibility
      raw: objectInfo
    };
  }

  /**
   * Get museum name
   */
  getMuseumName() {
    return 'Victoria and Albert Museum';
  }

  /**
   * Get museum logo
   */
  getMuseumLogo() {
    return 'https://www.vam.ac.uk/static/images/logo.png';
  }

  /**
   * Legacy method for backward compatibility
   */
  async start() {
    console.log("=== V&A API START FUNCTION CALLED ===");
    
    // Load user settings
    if (typeof chrome !== "undefined" && typeof chrome.storage !== "undefined") {
      return new Promise((resolve) => {
        chrome.storage.sync.get({
          userSearchTerms: "",
          strictSearch: "fuzzy"
        }, async (items) => {
          let searchTerms = this.defaultSearchTerms;
          let strictSearch = false;
          
          if (items.userSearchTerms.length > 0) {
            searchTerms = items.userSearchTerms.replace(/ /g, "+").split(",");
          }
          
          if (items.strictSearch === "strict") {
            strictSearch = true;
          }
          
          await this.init(searchTerms, strictSearch);
          
          try {
            const object = await this.getRandomObject();
            this.displayObject(object);
            resolve(object);
          } catch (error) {
            console.error('Failed to get random object:', error);
            SITE.throwError();
            resolve(null);
          }
        });
      });
    } else {
      // Fallback for standalone testing
      await this.init();
      try {
        const object = await this.getRandomObject();
        this.displayObject(object);
        return object;
      } catch (error) {
        console.error('Failed to get random object:', error);
        SITE.throwError();
        return null;
      }
    }
  }

  /**
   * Display object in the UI
   */
  displayObject(object) {
    // This would integrate with the UI components
    // For now, we'll use the existing display logic
    if (window.SITE && window.SITE.displayObject) {
      window.SITE.displayObject(object);
    }
  }
} 