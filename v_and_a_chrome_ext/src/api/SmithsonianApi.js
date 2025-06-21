/**
 * Smithsonian Museum API implementation
 * Example of how to add support for other museum APIs
 * Extends MuseumApi base class for Smithsonian-specific functionality
 */

import { MuseumApi } from './MuseumApi.js';
import { randomNum } from '../utils/helpers.js';

export class SmithsonianApi extends MuseumApi {
  constructor() {
    super({
      baseUrl: 'https://api.si.edu/openaccess/api/v1.0',
      searchEndpoint: '/search',
      objectEndpoint: '/object',
      apiKey: 'YOUR_SMITHSONIAN_API_KEY' // Would need to be configured
    });
    
    this.defaultSearchTerms = [
      "Art", "History", "Science", "Culture", "Technology", 
      "Natural History", "American History", "Space", "Aviation",
      "Maritime", "Military", "Fashion", "Jewelry", "Ceramics"
    ];
  }

  /**
   * Initialize with Smithsonian-specific settings
   */
  async init(searchTerms = null) {
    if (!searchTerms || searchTerms.length === 0) {
      searchTerms = this.defaultSearchTerms;
    }
    
    await super.init(searchTerms);
    
    // Display search terms in the side panel
    const searchTermsDisplay = this.searchTerms.join(", ");
    $("#search-terms").text(searchTermsDisplay);
  }

  /**
   * Search for objects in Smithsonian collection
   */
  async searchObjects(searchTerm, options = {}) {
    if (!this.canSearch()) {
      throw new Error('Maximum search attempts reached');
    }

    this.incrementSearchCount();
    
    const params = new URLSearchParams({
      q: searchTerm || this.getRandomSearchTerm(),
      limit: options.limit || '1',
      api_key: this.config.apiKey
    });

    const url = `${this.config.baseUrl}${this.config.searchEndpoint}?${params}`;
    
    try {
      const data = await this.makeRequest(url);
      return this.normalizeSearchResults(data);
    } catch (error) {
      console.error('Smithsonian search failed:', error);
      throw error;
    }
  }

  /**
   * Get a random object from Smithsonian collection
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
        start: randomOffset
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
   * Get a specific object by ID
   */
  async getObject(objectId, options = {}) {
    const params = new URLSearchParams({
      id: objectId,
      api_key: this.config.apiKey
    });

    const url = `${this.config.baseUrl}${this.config.objectEndpoint}?${params}`;
    
    try {
      const data = await this.makeRequest(url);
      return this.normalizeObjectData(data);
    } catch (error) {
      console.error('Failed to get object:', error);
      throw error;
    }
  }

  /**
   * Normalize Smithsonian search results
   */
  normalizeSearchResults(data) {
    return {
      totalCount: data.response?.rowCount || 0,
      objects: data.response?.rows?.map(row => this.normalizeObjectData({ response: { row } })) || [],
      info: data.response
    };
  }

  /**
   * Normalize Smithsonian object data to common format
   */
  normalizeObjectData(data) {
    const objectInfo = data.response?.row || data.response?.rows?.[0];
    
    if (!objectInfo) {
      throw new Error('No object data found');
    }
    
    return {
      id: objectInfo.id,
      title: objectInfo.title || 'Untitled',
      description: objectInfo.description || '',
      date: objectInfo.date || '',
      maker: objectInfo.creator || '',
      makerAssociation: objectInfo.creatorType || '',
      place: objectInfo.place || '',
      objectType: objectInfo.objectType || '',
      accessionNumber: objectInfo.accessionNumber || '',
      currentLocation: objectInfo.location || '',
      onDisplay: objectInfo.onDisplay || false,
      
      // Image data
      imageId: objectInfo.imageId,
      thumbnailUrl: objectInfo.thumbnailUrl || '',
      imageBaseUrl: objectInfo.imageBaseUrl || '',
      manifestUrl: objectInfo.manifestUrl || '',
      
      // Smithsonian-specific URLs
      collectionUrl: `https://www.si.edu/object/${objectInfo.id}`,
      
      // Raw data for backward compatibility
      raw: objectInfo
    };
  }

  /**
   * Get museum name
   */
  getMuseumName() {
    return 'Smithsonian Institution';
  }

  /**
   * Get museum logo
   */
  getMuseumLogo() {
    return 'https://www.si.edu/sites/default/files/logo.png';
  }
} 