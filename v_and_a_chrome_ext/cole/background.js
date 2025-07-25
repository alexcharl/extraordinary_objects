// Background script for V&A Chrome Extension
// Handles API requests to bypass CORS restrictions

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'makeVaRequest') {
    const { systemNumber, searchTerm, offset, limit, withImages, withDescription, after, hasImage } = request.params;
    
    // Build query parameters for v2 API
    const pageSize = limit || '1';
    let page = '1';
    
    if (offset !== null && offset !== undefined) {
      // Calculate the correct page for the given offset
      const calculatedPage = Math.floor(offset / parseInt(pageSize)) + 1;
      
      // Ensure page number is valid (minimum 1, maximum 1000 to prevent 500 errors)
      page = Math.max(1, Math.min(calculatedPage, 1000)).toString();
    }
    
    const params = new URLSearchParams({
      page_size: pageSize,
      page: page,
      images_exist: hasImage || '1',
      image_restrict: '2' // Request 2500px images for better quality
    });
    
    // Add search term or system number
    if (systemNumber) {
      params.set('kw_system_number', systemNumber);
    } else if (searchTerm) {
      params.set('q', searchTerm);
    }
    
    const url = `https://api.vam.ac.uk/v2/objects/search?${params}`;
    
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        // Keep essential error logging for debugging
        console.error('V&A API request failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep the message channel open for async response
  }
  
  // Handle test message
  if (request.action === 'test') {
    sendResponse({ success: true, message: 'Background script is working' });
    return true;
  }
});