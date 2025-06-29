/**
 * HistoryComponent
 * Encapsulates the logic for the history overlay (recently viewed objects)
 */
export class HistoryComponent {
  constructor() {
    this.$overlay = $('.overlay');
    this.$historyOpenBtn = $('.history');
    this.$overlayCloseBtn = $('.close-overlay');
    this.$historyObjects = $('#history-objects');
    this.$historyWrapper = $('.history-wrapper .loading');
    this.appState = null;
  }

  init() {
    // Get the AppState instance from the global SITE object
    if (window.SITE && window.SITE.getState) {
      this.appState = window.SITE.getState();
    }
    this.bindEvents();
  }

  bindEvents() {
    this.$historyOpenBtn.on('click', () => this.show());
    this.$overlayCloseBtn.on('click', () => this.hide());
  }

  show() {
    if (this.$overlay.hasClass('closed')) {
      this.$overlay.removeClass('closed').addClass('open for-history');
      this.renderHistory();
      this.$overlay.fadeIn(500);
    }
  }

  hide() {
    this.$historyObjects.text('');
    this.$overlay.fadeOut(500, () => {
      this.$overlay.removeClass('open for-history for-warning').addClass('closed');
    });
  }

  renderHistory() {
    this.$historyWrapper.addClass('loaded');
    
    // Get history from AppState if available, otherwise fall back to global
    let history = [];
    if (this.appState) {
      const state = this.appState.getState();
      history = state.history?.items || [];
    } else {
      history = window.theHistory || [];
    }
    
    let count = 0;
    if (!history || history.length === 0) {
      this.$historyObjects.html('<p class="no-history">No objects viewed yet. Start exploring the V&A collection!</p>');
      return;
    }
    this.$historyObjects.empty();
    history.forEach((i) => {
      let historyObjectHTML = '';
      historyObjectHTML += `<a class="history-object hide-until-loaded" data-object-number="${i.id || i.objectNumber}" href="${i.collectionUrl || i.vaCollectionsUrl}" title="View this item in the V&amp;A archive">`;
      historyObjectHTML += `<div class="history-object-image-holder" style="background-image: url('${i.imageUrl}');"></div>`;
      historyObjectHTML += `<img src="${i.imageUrl}" class="image-holder-for-loading" id="image-holder-${count}" >`;
      historyObjectHTML += '<div class="history-object-info">';
      historyObjectHTML += `<p><strong>${i.title}</strong>, ${i.date}</p>`;
      historyObjectHTML += `<p>${i.maker || i.artist}</p>`;
      historyObjectHTML += '</div></a>';
      this.$historyObjects.append(historyObjectHTML);
      $(`#image-holder-${count}`).on('load', function() {
        $(this).parent().addClass('loaded');
        $(this).remove(); // prevent memory leaks
      });
      count++;
    });
  }
} 