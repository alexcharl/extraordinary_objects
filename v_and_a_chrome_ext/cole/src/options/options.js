// Saves options to chrome.storage
function save_options() {
  var userSearchTerms = document.getElementById('searchTerms').value;
  var strictSearch = document.getElementById('strictSearch').checked == true ? document.getElementById('strictSearch').value : 'fuzzy';
  console.log("userSearchTerms = "+userSearchTerms);
  console.log("strictSearch = "+strictSearch);
  chrome.storage.sync.set({
    userSearchTerms: userSearchTerms,
    strictSearch: strictSearch
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved';
    setTimeout(function() {
      status.textContent = ' ';
    }, 2000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    userSearchTerms: '',
    strictSearch: ''
  }, function(items) {
    if (items.userSearchTerms.length>1) {
      document.getElementById('searchTerms').value = items.userSearchTerms;
    } else {
      document.getElementById('searchTerms').value = 'Asia,British,Ceramics,Childhood,Contemporary,Fashion,Jewellery,Furniture,Glass,Metalwork,Paintings,Drawings,Photography,Prints,Books,Sculpture,Textiles,Theatre';
 
    }
    if (items.strictSearch == 'strict') {
      document.getElementById('strictSearch').checked = true;
      document.getElementById('strictSearch').setAttribute("checked","checked");
    }
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);