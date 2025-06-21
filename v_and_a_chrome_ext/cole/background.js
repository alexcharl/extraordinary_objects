// Background script for V&A Chrome Extension
// Handles API requests to bypass CORS restrictions

console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.action === 'makeVaRequest') {
    const { systemNumber, searchTerm, offset, limit, withImages, withDescription, after, random, hasImage } = request.params;
    
    console.log('Making V&A API request with params:', request.params);
    
    // Build query parameters for v2 API
    const pageSize = limit || '1';
    let page = '1';
    
    if (offset !== null && offset !== undefined) {
      // Calculate the correct page for the given offset
      const calculatedPage = Math.floor(offset / parseInt(pageSize)) + 1;
      
      // Ensure page number is valid (minimum 1, maximum 1000 to prevent 500 errors)
      page = Math.max(1, Math.min(calculatedPage, 1000)).toString();
      
      console.log(`Offset: ${offset}, Page size: ${pageSize}, Calculated page: ${calculatedPage}, Final page: ${page}`);
    }
    
    const queryParams = new URLSearchParams({
      page_size: pageSize,
      page: page
    });
    
    if (searchTerm) {
      queryParams.set('q', searchTerm);
    }
    
    if (systemNumber) {
      queryParams.set('kw_system_number', systemNumber);
    }
    
    if (hasImage) {
      queryParams.set('has_image', hasImage);
    }
    
    const url = `https://api.vam.ac.uk/v2/objects/search?${queryParams.toString()}`;
    console.log('API URL:', url);
    
    fetch(url)
      .then(response => {
        console.log('API response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API response data received');
        console.log('Response info:', data.info);
        console.log('Total pages available:', data.info.pages);
        console.log('Requested page:', page);
        console.log('Number of records returned:', data.records ? data.records.length : 0);
        if (data.records && data.records.length > 0) {
          console.log('First record system number:', data.records[0].systemNumber);
        } else {
          console.log('No records returned - this might indicate a pagination issue');
        }
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('V&A API request failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep the message channel open for async response
  }
  
  // Handle test message
  if (request.action === 'test') {
    console.log('Test message received');
    sendResponse({ success: true, message: 'Background script is working' });
    return true;
  }
});

// Log when the service worker starts
self.addEventListener('install', (event) => {
  console.log('Background script installed');
});

self.addEventListener('activate', (event) => {
  console.log('Background script activated');
});