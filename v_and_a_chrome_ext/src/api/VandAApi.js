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
    const hasImage = '1'; // Always request objects with images
    
    return new Promise((resolve, reject) => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'makeVaRequest',
          params: {
            systemNumber: systemNumber,
            searchTerm: searchTerm,
            offset: offset,
            limit: limit,
            hasImage: hasImage
          }
        }, function(response) {
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response ? response.error : "No response from background script"));
          }
        });
      } else {
        // Fallback for standalone testing (won't work due to CORS)
        reject(new Error("Chrome extension context not available"));
      }
    });
  }

  /**
   * Search for objects in V&A collection
   */
  async searchObjects(searchTerm, options = {}) {
    const params = new URLSearchParams({
      q: searchTerm || this.getRandomSearchTerm(),
      page_size: options.limit || '1',
      page: options.page || '1',
      images_exist: options.imagesExist ? '1' : undefined,
      image_restrict: '2' // Always request 2500px images for better quality
    });
    
    // Handle offset parameter (convert to page number)
    if (options.offset !== undefined && options.offset !== null) {
      const pageSize = parseInt(options.limit || '1');
      const page = Math.floor(options.offset / pageSize) + 1;
      params.set('page', page.toString());
    }
    
    // Remove undefined params
    for (const [key, value] of params.entries()) {
      if (value === undefined) params.delete(key);
    }
    const url = `${this.config.baseUrl}${this.config.searchEndpoint}?${params}`;
    try {
      const data = await this.makeRequest(url);
      return this.normalizeSearchResults(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a truly random object from V&A collection using random offset
   */
  async getRandomObject(searchTerm = null, options = {}) {
    try {
      // Pick random search term if none provided
      if (!searchTerm) {
        searchTerm = this.getRandomSearchTerm();
      }
      
      // Step 1: Get total count for this search term (without random parameter)
      const initialSearch = await this.searchObjects(searchTerm, {
        limit: '1',
        page: 1,
        imagesExist: true
      });
      
      const totalCount = initialSearch.totalCount;
      
      if (totalCount === 0) {
        throw new Error(`No objects found for search term: ${searchTerm}`);
      }
      
      // Step 2: Generate random offset (same as old implementation)
      const randomOffset = Math.floor(Math.random() * totalCount);
      
      // Step 3: Get object at random offset
      const randomResults = await this.searchObjects(searchTerm, {
        limit: '1',
        offset: randomOffset,
        imagesExist: true
      });
      
      if (!randomResults.objects.length) {
        throw new Error('No random object found at calculated offset');
      }
      
      // Step 4: Get the specific object details and add search term
      const objectId = randomResults.objects[0].id;
      const object = await this.getObject(objectId, options);
      
      // Add the search term to the object data
      object.searchTerm = searchTerm;
      
      return object;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific object by system number
   */
  async getObject(systemNumber, options = {}) {
    // The V&A API's system number is unique, so we expect only one result.
    // However, we still specify page_size: '1' and page: '1' to ensure we get the first (and only) result.
    // This does not limit the scope, since system numbers are unique and only one object should match.
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
    
    // Handle artist dates if available
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
    
    // Extract materials and techniques from raw data if available
    let materials = "";
    if (objectInfo._materials && objectInfo._materials.length > 0) {
      materials = objectInfo._materials.map(m => m.name).join(", ");
    }
    
    // Extract techniques from raw data if available
    let techniques = "";
    if (objectInfo._techniques && objectInfo._techniques.length > 0) {
      techniques = objectInfo._techniques.map(t => t.name).join(", ");
    }
    
    // Extract subjects from raw data if available
    let subjects = "";
    if (objectInfo._subjects && objectInfo._subjects.length > 0) {
      subjects = objectInfo._subjects.map(s => s.name).join(", ");
    }
    
    // Extract physical description from raw data if available
    let physicalDescription = "";
    if (objectInfo._physicalDescription) {
      physicalDescription = objectInfo._physicalDescription;
    }
    
    // Extract dimensions from raw data if available
    let dimensions = "";
    if (objectInfo._dimensions) {
      dimensions = objectInfo._dimensions;
    }
    
    // Extract accession year if available
    let accessionYear = "";
    if (objectInfo.accessionYear) {
      accessionYear = objectInfo.accessionYear;
    } else if (objectInfo.accessionNumber) {
      // Try to extract year from accession number (format: LETTER.YEAR-NUMBER)
      const match = objectInfo.accessionNumber.match(/(\d{4})/);
      if (match) {
        accessionYear = match[1];
      }
    }
    
    // Extract additional historical context from date information
    let historicalContext = "";
    if (objectInfo._primaryDate) {
      const date = objectInfo._primaryDate;
      // Add historical period context based on date
      if (date.includes("19th century") || (date.match(/\d{4}/) && parseInt(date.match(/\d{4}/)[0]) < 1900)) {
        historicalContext = "Victorian era";
      } else if (date.includes("18th century") || (date.match(/\d{4}/) && parseInt(date.match(/\d{4}/)[0]) < 1800)) {
        historicalContext = "Georgian era";
      } else if (date.includes("17th century") || (date.match(/\d{4}/) && parseInt(date.match(/\d{4}/)[0]) < 1700)) {
        historicalContext = "Stuart era";
      } else if (date.includes("16th century") || (date.match(/\d{4}/) && parseInt(date.match(/\d{4}/)[0]) < 1600)) {
        historicalContext = "Tudor era";
      } else if (date.includes("20th century") || (date.match(/\d{4}/) && parseInt(date.match(/\d{4}/)[0]) >= 1900 && parseInt(date.match(/\d{4}/)[0]) < 2000)) {
        historicalContext = "Modern era";
      } else if (date.includes("21st century") || (date.match(/\d{4}/) && parseInt(date.match(/\d{4}/)[0]) >= 2000)) {
        historicalContext = "Contemporary era";
      }
    }
    
    // Build a rich description from multiple sources
    let richDescription = "";
    const descriptionParts = [];
    
    // Start with primary description if available
    if (objectInfo._primaryDescription && objectInfo._primaryDescription.trim() !== "") {
      descriptionParts.push(objectInfo._primaryDescription);
    }
    
    // Add physical description if different from primary
    if (physicalDescription && physicalDescription.trim() !== "" && 
        physicalDescription !== objectInfo._primaryDescription) {
      descriptionParts.push(physicalDescription);
    }
    
    // Add subjects if available
    if (subjects && subjects.trim() !== "") {
      descriptionParts.push(`Depicts: ${subjects}`);
    }
    
    // Add techniques if available
    if (techniques && techniques.trim() !== "") {
      descriptionParts.push(`Made using: ${techniques}`);
    }
    
    // Add historical context if available
    if (historicalContext && historicalContext.trim() !== "") {
      descriptionParts.push(`Historical period: ${historicalContext}`);
    }
    
    // Add accession year for historical context
    if (accessionYear && accessionYear.trim() !== "") {
      descriptionParts.push(`Acquired by the V&A in ${accessionYear}`);
    }
    
    // Combine all description parts
    if (descriptionParts.length > 0) {
      richDescription = descriptionParts.join(". ");
    }
    
    return {
      id: objectInfo.systemNumber,
      title: objectInfo._primaryTitle || 'Untitled',
      description: richDescription || objectInfo._primaryDescription || '',
      date: objectInfo._primaryDate || '',
      maker: objectInfo._primaryMaker?.name || '',
      makerAssociation: objectInfo._primaryMaker?.association || '',
      datesAlive: datesAlive, // Add artist dates
      place: objectInfo._primaryPlace || '',
      objectType: objectInfo.objectType || '',
      accessionNumber: objectInfo.accessionNumber || '',
      currentLocation: objectInfo._currentLocation?.displayName || '',
      onDisplay: objectInfo._currentLocation?.onDisplay || false,
      
      // Technical details
      materials: materials, // Add materials and techniques
      techniques: techniques, // Add techniques
      subjects: subjects, // Add subjects
      physicalDescription: physicalDescription, // Add physical description
      dimensions: dimensions, // Add dimensions
      accessionYear: accessionYear, // Add accession year
      historicalContext: historicalContext, // Add historical context
      
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