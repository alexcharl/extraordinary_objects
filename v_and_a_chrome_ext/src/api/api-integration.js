/**
 * API Integration Layer
 * Uses the new MuseumApi abstraction while maintaining backward compatibility
 */

import { VandAApi } from './VandAApi.js';
import { AppState } from '../core/AppState.js';

// Global SITE object for backward compatibility
window.SITE = window.SITE || {};

// Initialize state and API
const appState = new AppState();
const vandaApi = new VandAApi();

/**
 * Start the API integration (backward compatible with old start() function)
 */
export async function start() {
  try {
    // Initialize AppState
    await appState.loadSettings();
    await appState.loadHistory(); // Load existing history from storage
    
    const settings = appState.getStateSlice('settings');
    
    // Initialize API with settings
    await vandaApi.init(settings.searchTerms, settings.strictSearch);
    
    // Get and display a random object
    const object = await vandaApi.getRandomObject();
    appState.setCurrentObject(object);
    appState.addToHistory(object);
    
    // Display the object
    displayObject(object);
    
    return object;
  } catch (error) {
    console.error('Failed to start application:', error);
    appState.setApiError(error.message);
    SITE.throwError();
    return null;
  }
}

/**
 * Make a V&A request (backward compatible with old makeVaRequest function)
 */
export async function makeVaRequest(systemNumber, searchTerm, offset, limit, withImages, withDescription, after, random) {
  try {
    appState.setApiLoading(true);
    
    if (!appState.canSearch()) {
      throw new Error('Maximum search attempts reached');
    }
    
    appState.incrementSearchCount();
    
    let object;
    
    if (systemNumber) {
      // Get specific object
      object = await vandaApi.getObject(systemNumber);
    } else {
      // Get random object with search term
      object = await vandaApi.getRandomObject(searchTerm, {
        limit: limit || '1',
        offset: offset
      });
    }
    
    // Update state
    appState.setCurrentObject(object);
    appState.addToHistory(object);
    
    // Display the object
    displayObject(object);
    
    appState.setApiLoading(false);
    
  } catch (error) {
    console.error("makeVaRequest failed:", error);
    appState.setApiError(error.message);
    appState.setApiLoading(false);
    
    // Retry with different search term if this was a random search
    if (!systemNumber) {
      const newSearchTerm = vandaApi.getRandomSearchTerm();
      await makeVaRequest(null, newSearchTerm, offset, limit, withImages, withDescription, after, random);
    } else {
      SITE.throwError();
    }
  }
}

/**
 * Process response (backward compatible with old processResponse function)
 * This is now handled internally by the new API, but kept for compatibility
 */
export function processResponse(data, expectResponse) {
  console.log("processResponse called with data:", data);
  
  // Convert the new normalized object format to the old format for display
  if (data && data.id) {
    // This is a normalized object from the new API
    displayObject(data);
  } else if (data && data.records) {
    // This is the old API format - convert and display
    const object = vandaApi.normalizeObjectData(data);
    displayObject(object);
  }
}

/**
 * Display object using the existing UI logic
 * This maintains compatibility with the current display system
 */
function displayObject(object) {
  console.log("Displaying object:", object);
  
  // Extract data from normalized object
  const {
    id: theSystemNumber,
    title: theTitle,
    description: theDescription,
    date: theDate,
    maker: theArtist,
    makerAssociation: theArtistAssociation,
    datesAlive: datesAlive,
    place: thePlace,
    objectType: theObject,
    accessionNumber: theMuseumNumber,
    currentLocation: theMuseumLocation,
    materials: theMaterials,
    techniques: theTechniques,
    subjects: theSubjects,
    physicalDescription: thePhysicalDescription,
    dimensions: theDimensions,
    accessionYear: theAccessionYear,
    historicalContext: theHistoricalContext,
    searchTerm: theSearchTerm,
    imageUrl: imgUrl,
    collectionUrl: objectUrl,
    raw: objectInfo // Original V&A data for backward compatibility
  } = object;
  
  // Clean up title
  let cleanTitle = theTitle.replace(/\^/, "");
  cleanTitle = cleanTitle.replace(/\<i\>/g, "");
  cleanTitle = cleanTitle.replace(/\<\\i\>/g, "");
  cleanTitle = cleanTitle.replace(/\<b\>/g, "");
  cleanTitle = cleanTitle.replace(/\<\\b\>/g, "");
  
  // Handle artist information
  const theSideCaption = "<strong>" + cleanTitle + " " + theDate + "</strong>" + " &mdash; " + theArtist + " " + datesAlive;
  
  // Create description if not provided
  let finalDescription = theDescription;
  if (!finalDescription || finalDescription.trim() === "") {
    const descriptionParts = [];
    if (cleanTitle && cleanTitle !== theObject) {
      descriptionParts.push(cleanTitle);
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
    
    finalDescription = descriptionParts.length > 0 
      ? descriptionParts.join(", ") + "." 
      : "A " + theObject + " from the V&A collection.";
  }
  
  // Clean up description text
  finalDescription = finalDescription.replace(/Object Type\n/g, "");
  finalDescription = finalDescription.replace(/People\n/g, "");
  finalDescription = finalDescription.replace(/Place\n/g, "");
  finalDescription = finalDescription.replace(/Places\n/g, "");
  finalDescription = finalDescription.replace(/Time\n/g, "");
  finalDescription = finalDescription.replace(/Design \& Designing\n/g, "");
  finalDescription = finalDescription.replace(/Design\n/g, "");
  finalDescription = finalDescription.replace(/Subject Depicted\n/g, "");
  finalDescription = finalDescription.replace(/Subjects Depicted\n/g, "");
  finalDescription = finalDescription.replace(/Materials \& Making\n/g, "");
  finalDescription = finalDescription.replace(/Collectors \& Owners\n/g, "");
  finalDescription = finalDescription.replace(/Ownership \& Use\n/g, "");
  finalDescription = finalDescription.replace(/Trading\n/g, "");
  finalDescription = finalDescription.replace(/Trade\n/g, "");
  finalDescription = finalDescription.replace(/Historical Associations\n/g, "");
  finalDescription = finalDescription.replace(/Other\n/g, "");
  finalDescription = finalDescription.replace(/\n\n\n/g, "\n\n");
  finalDescription = finalDescription.replace(/\n/g, "<br>");
  finalDescription = finalDescription.replace(/\<i\>/g, "");
  finalDescription = finalDescription.replace(/\<\\i\>/g, "");
  finalDescription = finalDescription.replace(/\<b\>/g, "");
  finalDescription = finalDescription.replace(/\<\\b\>/g, "");
  
  const finalDate = theDate || "";
  
  // Create Pinterest URL
  let pinterestUrl = "https://www.pinterest.com/pin/create/button/";
  pinterestUrl += "?url=" + objectUrl;
  pinterestUrl += "&media=" + imgUrl;
  pinterestUrl += "&description=" + cleanTitle;
  if (finalDate != "") pinterestUrl += " (" + thePlace + ", " + finalDate + ")";
  pinterestUrl += ", V%26A Collection";
  
  // Update UI elements
  if (cleanTitle.length > 42) {
    $("#title").addClass("reduced");
    $("#piece-date").addClass("reduced");
  }
  
  $("#creator-name").text(theArtist);
  $("#dates-alive").text(datesAlive);
  $("#title").html(cleanTitle);
  if (finalDate != "") $("#piece-date").text("(" + finalDate + ")");
  $("#place").html(thePlace);
  
  // Handle image display
  if (imgUrl && imgUrl !== "") {
    $("#image").attr("src", imgUrl);
    $("#pinterest-button").attr("href", pinterestUrl);
  } else {
    // No image available - show placeholder
    const $imageContainer = $('.object-image-wrapper');
    $imageContainer.html('<div class="image-placeholder"><p>Image not available</p><p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p></div>');
  }
  
  $("#page-link").attr("href", objectUrl);
  
  console.log("UI Updates - Setting title to:", cleanTitle);
  console.log("UI Updates - Setting artist to:", theArtist);
  console.log("UI Updates - Setting image to:", imgUrl);
  
  // Add fallback logic for missing description
  let descriptionContent = theDescription && theDescription.trim() !== "" 
    ? theDescription 
    : (thePhysicalDescription && thePhysicalDescription.trim() !== "" 
        ? thePhysicalDescription 
        : [cleanTitle, theDate, thePlace, theArtist].filter(Boolean).join(", ") + ".");
  $("#object-description").html("<p>" + descriptionContent + "</p>");
  
  $("#object-side-caption").html(theSideCaption);
  
  // Handle technical info sections
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
  
  if (thePlace != "") {
    $("#tech-info-place").text(thePlace);
  } else {
    $("#tech-info-place").hide();
    $("#tech-info-place").prev("h4").hide();
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
  
  // Handle search term
  if (theSearchTerm != "") {
    $("#search-term").text(theSearchTerm);
  } else {
    $("#search-term").hide();
    $("#search-term").prev("h4").hide();
  }
  
  // Handle physical description
  if (thePhysicalDescription != "") {
    $("#physical-description").html(thePhysicalDescription);
  } else {
    $("#physical-description").hide();
    $("#physical-description").prev("h4").hide();
  }
  
  // Handle materials and techniques
  if (theMaterials != "") {
    $("#tech-info-materials").html(theMaterials);
  } else {
    $("#tech-info-materials").hide();
    $("#tech-info-materials").prev("h4").hide();
  }
  
  // Handle techniques
  if (theTechniques != "") {
    // Add techniques section if it doesn't exist
    if ($("#tech-info-techniques").length === 0) {
      $("#tech-info-materials").after('<h4>Techniques</h4><p id="tech-info-techniques"></p>');
    }
    $("#tech-info-techniques").html(theTechniques);
  } else {
    $("#tech-info-techniques").hide();
    $("#tech-info-techniques").prev("h4").hide();
  }
  
  // Handle subjects
  if (theSubjects != "") {
    // Add subjects section if it doesn't exist
    if ($("#tech-info-subjects").length === 0) {
      $("#tech-info-techniques").after('<h4>Subjects</h4><p id="tech-info-subjects"></p>');
    }
    $("#tech-info-subjects").html(theSubjects);
  } else {
    $("#tech-info-subjects").hide();
    $("#tech-info-subjects").prev("h4").hide();
  }
  
  // Handle accession year
  if (theAccessionYear != "") {
    // Add accession year section if it doesn't exist
    if ($("#tech-info-accession-year").length === 0) {
      $("#tech-info-subjects").after('<h4>Acquired</h4><p id="tech-info-accession-year"></p>');
    }
    $("#tech-info-accession-year").text(theAccessionYear);
  } else {
    $("#tech-info-accession-year").hide();
    $("#tech-info-accession-year").prev("h4").hide();
  }
  
  // Handle historical context
  if (theHistoricalContext != "") {
    // Add historical context section if it doesn't exist
    if ($("#tech-info-historical-context").length === 0) {
      $("#tech-info-accession-year").after('<h4>Historical Period</h4><p id="tech-info-historical-context"></p>');
    }
    $("#tech-info-historical-context").text(theHistoricalContext);
  } else {
    $("#tech-info-historical-context").hide();
    $("#tech-info-historical-context").prev("h4").hide();
  }
  
  // Handle dimensions
  if (theDimensions != "") {
    $("#dimensions").text(theDimensions);
  } else {
    $("#dimensions").hide();
    $("#dimensions").prev("h4").hide();
  }
  
  // Trigger resize and show content
  SITE.onThrottledResize();
  $(".content-placeholder, .hide-until-loaded").addClass("loaded");
  
  // Handle image loading with error fallback
  if (imgUrl && imgUrl !== "") {
    $("img.image-hide-until-loaded").on('load', function() {
      $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
      $(this).removeClass("image-error");
    }).on('error', function() {
      console.log("Image failed to load:", imgUrl);
      const $imageContainer = $(this).closest('.object-image-wrapper');
      $imageContainer.html('<div class="image-placeholder"><p>Image not available</p><p><small>This object may not have been photographed yet, or the image may be temporarily unavailable.</small></p></div>');
      $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
    });
  } else {
    $(".image-hide-until-loaded, .hide-after-loaded").addClass("loaded");
  }
  
  // Save to history (handled by state management)
  console.log("Object displayed and saved to history");
}

/**
 * Get current API instance (for advanced usage)
 */
export function getApi() {
  return vandaApi;
}

/**
 * Get current state (for advanced usage)
 */
export function getState() {
  return appState;
}

// Export to global SITE object for backward compatibility
window.SITE.start = start;
window.SITE.makeVaRequest = makeVaRequest;
window.SITE.processResponse = processResponse;
window.SITE.getApi = getApi;
window.SITE.getState = getState; 