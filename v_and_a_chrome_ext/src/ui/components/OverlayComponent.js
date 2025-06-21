/**
 * OverlayComponent - Handles overlay functionality
 * Extracted from main.js for better modularity
 */

export class OverlayComponent {
  constructor() {
    this.$overlay = null;
    this.$overlayCloseBtn = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the component
   */
  init() {
    this.defineVars();
    this.bindEvents();
    this.isInitialized = true;
    console.log('OverlayComponent initialized');
  }

  /**
   * Define variables from global context
   */
  defineVars() {
    this.$overlay = $('.overlay');
    this.$overlayCloseBtn = $('.close-overlay');
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Close overlay button handler
    this.$overlayCloseBtn.click(() => {
      this.hideOverlay();
    });

    // Close overlay when clicking outside content
    this.$overlay.click((e) => {
      if (e.target === this.$overlay[0]) {
        this.hideOverlay();
      }
    });
  }

  /**
   * Show error overlay
   */
  showErrorOverlay() {
    this.$overlay.removeClass('closed').addClass('open for-warning');
    this.$overlay.fadeIn(500);
  }

  /**
   * Show overlay with custom content
   */
  showOverlay(content = null, className = '') {
    this.$overlay.removeClass('closed').addClass('open');
    
    if (className) {
      this.$overlay.addClass(className);
    }
    
    if (content) {
      this.$overlay.find('.overlay-content').html(content);
    }
    
    this.$overlay.fadeIn(500);
  }

  /**
   * Hide overlay
   */
  hideOverlay() {
    this.$overlay.removeClass('open for-warning').addClass('closed');
    this.$overlay.fadeOut(300);
  }

  /**
   * Check if overlay is currently visible
   */
  isVisible() {
    return this.$overlay.hasClass('open');
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this.isInitialized) {
      this.$overlayCloseBtn.off('click');
      this.$overlay.off('click');
      this.isInitialized = false;
      console.log('OverlayComponent destroyed');
    }
  }
} 