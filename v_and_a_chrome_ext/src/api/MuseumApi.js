/**
 * Base MuseumApi class for museum API abstraction
 * Provides a common interface for different museum APIs
 */

export class MuseumApi {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      apiKey: config.apiKey || null,
      searchEndpoint: config.searchEndpoint || '/search',
      objectEndpoint: config.objectEndpoint || '/object',
      ...config
    };
    
    this.searchCount = 0;
    this.maxSearchCounts = 5;
    this.currentSearchTerm = null;
    this.searchTerms = [];
  }

  /**
   * Initialize the API with search terms
   */
  async init(searchTerms = []) {
    this.searchTerms = searchTerms;
    console.log(`${this.constructor.name} initialized with ${searchTerms.length} search terms`);
  }

  /**
   * Get a random search term
   */
  getRandomSearchTerm() {
    if (this.searchTerms.length === 0) {
      throw new Error('No search terms available');
    }
    
    const randomIndex = Math.floor(Math.random() * this.searchTerms.length);
    this.currentSearchTerm = this.searchTerms[randomIndex];
    console.log(`Chosen search term: ${this.currentSearchTerm} from ${this.searchTerms.length} available terms`);
    return this.currentSearchTerm;
  }

  /**
   * Search for objects - to be implemented by subclasses
   */
  async searchObjects(searchTerm, options = {}) {
    throw new Error('searchObjects method must be implemented by subclass');
  }

  /**
   * Get a specific object by ID - to be implemented by subclasses
   */
  async getObject(objectId, options = {}) {
    throw new Error('getObject method must be implemented by subclass');
  }

  /**
   * Get a random object - to be implemented by subclasses
   */
  async getRandomObject(searchTerm = null, options = {}) {
    throw new Error('getRandomObject method must be implemented by subclass');
  }

  /**
   * Process and normalize object data - to be implemented by subclasses
   */
  normalizeObjectData(rawData) {
    throw new Error('normalizeObjectData method must be implemented by subclass');
  }

  /**
   * Check if search count limit reached
   */
  canSearch() {
    return this.searchCount < this.maxSearchCounts;
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

  /**
   * Make HTTP request with error handling
   */
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get museum name - to be implemented by subclasses
   */
  getMuseumName() {
    throw new Error('getMuseumName method must be implemented by subclass');
  }

  /**
   * Get museum logo/icon URL - to be implemented by subclasses
   */
  getMuseumLogo() {
    throw new Error('getMuseumLogo method must be implemented by subclass');
  }
} 