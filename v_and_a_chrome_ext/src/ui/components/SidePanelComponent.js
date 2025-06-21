/**
 * SidePanelComponent
 * Encapsulates the logic and event handling for the side panel (settings/about)
 */
export class SidePanelComponent {
  constructor() {
    this.$sidePanel = $('.side-panel');
    this.$sidePanelOpenBtn = $('.more');
    this.$sidePanelCloseBtn = $('.close-side-panel');
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    this.$sidePanelOpenBtn.on('click', () => this.togglePanel());
    this.$sidePanelCloseBtn.on('click', () => this.closePanel());
  }

  togglePanel() {
    if (this.$sidePanel.hasClass('open')) {
      this.$sidePanel.removeClass('open');
    } else {
      this.$sidePanel.addClass('open');
    }
  }

  closePanel() {
    this.$sidePanel.removeClass('open');
  }
} 