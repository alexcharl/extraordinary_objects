/**
 * V&A Museum API integration
 * Refactored from 3_va_api.js with ES6 module structure
 */

import { randomNum } from '../utils/helpers.js';

// Global SITE object for backward compatibility
window.SITE = window.SITE || {};

// V&A API v2 configuration
const vaUrl = "https://api.vam.ac.uk/v2/objects/search";
const vaMediaUrl = "https://media.vam.ac.uk/media/thira/collection_images/";
const vaCollectionsUrl = "https://collections.vam.ac.uk/item/";
const defaultSearchTerms = ["Architecture", "Asia", "British Galleries", "Ceramics", "Childhood", "Contemporary", "Fashion", "Jewellery", "Furniture", "Glass", "Metalwork", "Paintings", "Drawings", "Photography", "Prints", "Books", "Sculpture", "Textiles", "Theatre"];

let theSearchTerms;
let chosenSearchTerm;
let strictSearch = false;
let searchCount = 0;
const maxSearchCounts = 5;

/**
 * Choose a random search term from the available terms
 */
function chooseSearchTerm() {
  chosenSearchTerm = theSearchTerms[randomNum(0, theSearchTerms.length)];
  console.log("Chosen search term: " + chosenSearchTerm + " from " + theSearchTerms.length + " available terms");
}

/**
 * Start the V&A API integration
 */
export function start() {
  console.log("=== V&A API START FUNCTION CALLED ===");
  console.log("looking for user settings");
  
  // Test background script communication
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
    console.log("Testing background script communication...");
    chrome.runtime.sendMessage({action: 'test'}, function(response) {
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
      
      // Display search terms in the side panel
      const searchTermsDisplay = theSearchTerms.join(", ");
      $("#search-terms").text(searchTermsDisplay);
      
      chooseSearchTerm();
      makeVaRequest(null, chosenSearchTerm);
    });
  } else {
    console.log("Running as standalone page, using default search terms: " + defaultSearchTerms);
    theSearchTerms = defaultSearchTerms;
    
    // Display search terms in the side panel
    const searchTermsDisplay = theSearchTerms.join(", ");
    $("#search-terms").text(searchTermsDisplay);
    
    chooseSearchTerm();
    makeVaRequest(null, chosenSearchTerm);
  }
}

/**
 * Make a request to the V&A API
 */
export function makeVaRequest(systemNumber, searchTerm, offset, limit, withImages, withDescription, after, random) {
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
    const quality = typeof quality !== "undefined" ? quality : null;
    let expectResponse = 0;
    
    if (offset != null) {
      expectResponse = 1;
    } else if (systemNumber != null) {
      expectResponse = 2;
    }
    
    if (strictSearch == true) {
      const searchItem = searchTerm;
      searchTerm = null;
    } else {
      const searchItem = null;
    }
    
    console.log("strictSearch = " + strictSearch);
    console.log("expectResponse = " + expectResponse);
    console.log("Chosen term = " + searchTerm);
    console.log("offset = " + offset);
    
    // Use background script to make API request
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
          after: after,
          random: random,
          hasImage: "1"
        }
      }, function(response) {
        console.log("Received response from background script:", response);
        if (response && response.success) {
          console.log("API request successful");
          processResponse(response.data, expectResponse);
        } else {
          console.log("API request failed:", response ? response.error : "No response");
          // Retry with different search term
          chooseSearchTerm();
          makeVaRequest(null, chosenSearchTerm);
        }
      });
    } else {
      // Fallback for standalone testing (won't work due to CORS)
      console.log("Running as standalone page - API requests will fail due to CORS");
      SITE.throwError();
    }
  } else {
    console.log("maximum number of search attempts reached, try changing search terms");
    SITE.throwError();
  }
}

/**
 * Process the API response
 */
export function processResponse(data, expectResponse) {
  console.log(data);
  if (expectResponse === 0) {
    const numRecords = data.records.length;
    if (numRecords > 0) {
      const randomOffset = randomNum(0, data.info.record_count - 1);
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
    const numRecords = data.records.length;
    console.log("There are " + numRecords + " objects available.");
    const whichObject = data.records[0];
    const systemNumber = whichObject.systemNumber;
    console.log("Selected object system number: " + systemNumber);
    makeVaRequest(systemNumber);
    return;
  }
  
  // Process individual object data
  if (!data.records || data.records.length === 0) {
    console.log("No object found for system number, trying a different search term");
    chooseSearchTerm();
    makeVaRequest(null, chosenSearchTerm);
    return;
  }
  
  let objectInfo = data.records[0];
  console.log("Processing object data:", objectInfo);
  
  let imageId = objectInfo._primaryImageId;
  
  // Check if object has a valid image - but allow objects without images to be displayed
  // Only try to find another object if we're in a search results context and have multiple objects
  if ((!imageId || imageId === null || imageId === "") && expectResponse !== 2 && data.records.length > 1) {
    console.log("Object has no image, trying next object in search results");
    // Try the next object in the list
    objectInfo = data.records[1];
    imageId = objectInfo._primaryImageId;
    // If the next object also has no image, just proceed with it anyway
    console.log("Next object image ID:", imageId);
  }
  
  const theObject = objectInfo.objectType;
  let theTitle = objectInfo._primaryTitle != "" ? objectInfo._primaryTitle : objectInfo.objectType;
  const theDate = objectInfo._primaryDate;
  const theSlug = objectInfo.systemNumber; // Use systemNumber as slug for URL
  const theArtist = objectInfo._primaryMaker && objectInfo._primaryMaker.name ? objectInfo._primaryMaker.name : "";
  const theSystemNumber = objectInfo.systemNumber;
  const theMaterials = ""; // Not available in v2 API response
  let theDescription = ""; // Not available in v2 API response
  const theContext = ""; // Not available in v2 API response
  
  console.log("Extracted data - Title:", theTitle, "Artist:", theArtist, "System Number:", theSystemNumber, "Image ID:", imageId);
  
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
  
  // Use IIIF format for image URLs
  let imgUrl = "";
  if (imageId && imageId !== null && imageId !== "") {
    imgUrl = "https://framemark.vam.ac.uk/collections/" + imageId + "/full/1000,/0/default.jpg";
  }
  
  const objectUrl = vaCollectionsUrl + theSystemNumber + "/" + theSlug;
  let thePhysicalDescription = ""; // Not available in v2 API response
  const theDimensions = ""; // Not available in v2 API response
  const thePlace = objectInfo._primaryPlace;
  const theMuseumNumber = objectInfo.accessionNumber;
  const theMuseumLocation = objectInfo._currentLocation ? objectInfo._currentLocation.displayName : "";
  
  theTitle = theTitle.replace(/\^/, "");
  theTitle = theTitle.replace(/\<i\>/g, "");
  theTitle = theTitle.replace(/\<\\i\>/g, "");
  theTitle = theTitle.replace(/\<b\>/g, "");
  theTitle = theTitle.replace(/\<\\b\>/g, "");
  
  const theSideCaption = "<strong>" + theTitle + " " + theDate + "</strong>" + " &mdash; " + theArtist + " " + datesAlive;
  
  // Create a meaningful description from available data
  const descriptionParts = [];
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
  
  theDescription = descriptionParts.length > 0 ? descriptionParts.join(", ") + "." : "A " + theObject + " from the V&A collection.";
  
  // Clean up description text
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
  
  const finalDate = typeof theDate !== "undefined" && theDate != null ? theDate : "";
  
  let pinterestUrl = "https://www.pinterest.com/pin/create/button/";
  pinterestUrl += "?url=" + objectUrl;
  pinterestUrl += "&media=" + imgUrl;
  pinterestUrl += "&description=" + theTitle;
  if (finalDate != "") pinterestUrl += " (" + thePlace + ", " + finalDate + ")";
  pinterestUrl += ", V%26A Collection";
  
  if (theTitle.length > 42) {
    $("#title").addClass("reduced");
    $("#piece-date").addClass("reduced");
  }
  
  $("#creator-name").text(theArtist);
  $("#dates-alive").text(datesAlive);
  $("#title").html(theTitle);
  if (finalDate != "") $("#piece-date").text("(" + finalDate + ")");
  $("#place").html(thePlace);
  
  // Handle image display
  if (imgUrl && imgUrl !== "") {
    $("#image").attr("src", imgUrl);
    $("#pinterest-button").attr("href", pinterestUrl);
  } else {
    // No image available - show placeholder immediately
    const $imageContainer = $('.object-image-wrapper');
    $imageContainer.html('<div class="image-placeholder"><p>Image not available</p><p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p></div>');
  }
  $("#page-link").attr("href", objectUrl);
  
  console.log("UI Updates - Setting title to:", theTitle);
  console.log("UI Updates - Setting artist to:", theArtist);
  console.log("UI Updates - Setting image to:", imgUrl);
  
  // Add fallback logic for missing description
  const descriptionContent = theDescription && theDescription.trim() !== "" ? theDescription : "No description available for this object.";
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
  if (finalDate != "") {
    $("#tech-info-piece-date").text(finalDate);
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
  
  // Handle image loading with error fallback (only if we have an image)
  if (imgUrl && imgUrl !== "") {
    $("img.image-hide-until-loaded").on('load', function() {
      $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
      $(this).removeClass("image-error");
    }).on('error', function() {
      console.log("Image failed to load:", imgUrl);
      // Replace broken image with placeholder message
      const $imageContainer = $(this).closest('.object-image-wrapper');
      $imageContainer.html('<div class="image-placeholder"><p>Image not available</p><p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p></div>');
      $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
    });
  } else {
    // No image to load, so mark as loaded immediately
    $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
  }

  // Save object to history and persist
  if (expectResponse !== 0 && expectResponse !== 1) {
    const historyObject = {
      objectNumber: theSystemNumber,
      vaCollectionsUrl: objectUrl,
      imageUrl: imgUrl,
      title: theTitle,
      date: finalDate,
      artist: theArtist,
      systemNumber: theSystemNumber
    };
    const history = window.theHistory || [];
    history.push(historyObject);
    if (history.length > (window.maxHistoryItems || 10)) {
      history.shift();
    }
    window.theHistory = history; // Update global reference
    if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
      chrome.storage.local.set({objectHistory: history}, function() {
        console.log('History saved to storage:', history.length, 'items');
      });
    }
  }
}

// Export to global SITE object for backward compatibility
window.SITE.start = start;
window.SITE.makeVaRequest = makeVaRequest;
window.SITE.processResponse = processResponse; 