/**
 * ObjectDisplayComponent - Handles object display logic
 * Extracted from main.js for better modularity
 */

export class ObjectDisplayComponent {
  constructor() {
    this.$textContent = null;
    this.$objectCaption = null;
    this.$objectHeader = null;
    this.$downArrow = null;
    this.HEIGHT = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the component
   */
  init() {
    this.defineVars();
    this.bindEvents();
    this.isInitialized = true;
    console.log('ObjectDisplayComponent initialized');
  }

  /**
   * Define variables from global context
   */
  defineVars() {
    const gv = window.gv;
    this.HEIGHT = gv.HEIGHT;
    
    this.$textContent = $('.text-content-column');
    this.$objectCaption = $('.object-caption');
    this.$objectHeader = $('.object-header');
    this.$downArrow = $('.down-arrow');
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Down arrow click handler
    this.$downArrow.click(() => {
      $('#object-description').velocity('scroll', {
        duration: 700,
        offset: -100,
        easing: 'ease-in-out',
        container: this.$textContent
      });
    });

    // Scroll handler for caption and header visibility
    this.$textContent.on('scroll', this.throttledScroll.bind(this));
  }

  /**
   * Handle scroll events for caption and header visibility
   */
  onThrottledScroll() {
    const scrollAmt = this.$textContent.scrollTop();

    if (scrollAmt > this.HEIGHT * 0.5) {
      // show the caption
      this.$objectCaption.addClass('reveal');
    } else {
      // hide the caption
      this.$objectCaption.removeClass('reveal');
    }

    if (scrollAmt > this.HEIGHT * 0.5) {
      // hide the header
      this.$objectHeader.addClass('hide');
    } else {
      // show the header
      this.$objectHeader.removeClass('hide');
    }
  }

  /**
   * Throttled scroll handler
   */
  throttledScroll() {
    // DO SOMETHING EVERY 250ms
    this.onThrottledScroll();
  }

  /**
   * Update height when window resizes
   */
  updateHeight(newHeight) {
    this.HEIGHT = newHeight;
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this.isInitialized) {
      this.$textContent.off('scroll', this.throttledScroll.bind(this));
      this.$downArrow.off('click');
      this.isInitialized = false;
      console.log('ObjectDisplayComponent destroyed');
    }
  }
} 