/**
 * Side Panel Component
 * 
 * Manages the side panel functionality including:
 * - About information display
 * - Search terms display
 * - Settings navigation
 * - Panel open/close animations
 */

class SidePanelComponent extends BaseComponent {
    constructor(options = {}) {
        super('SidePanel', options);
        this.isOpen = false;
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            sidePanel: document.querySelector('.side-panel'),
            sidePanelOpenBtn: document.querySelector('.more'),
            sidePanelCloseBtn: document.querySelector('.close-side-panel'),
            searchTerms: document.getElementById('search-terms'),
            goToOptionsBtn: document.querySelector('.go-to-options')
        };
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Side panel open button
        if (this.elements.sidePanelOpenBtn) {
            this.addEvent(this.elements.sidePanelOpenBtn, 'click', this.handlePanelToggle);
        }
        
        // Side panel close button
        if (this.elements.sidePanelCloseBtn) {
            this.addEvent(this.elements.sidePanelCloseBtn, 'click', this.handlePanelClose);
        }
        
        // Go to options button
        if (this.elements.goToOptionsBtn) {
            this.addEvent(this.elements.goToOptionsBtn, 'click', this.handleGoToOptions);
        }
        
        // Close panel when clicking outside
        this.addEvent(document, 'click', this.handleOutsideClick);
    }
    
    /**
     * Handle panel toggle
     */
    handlePanelToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }
    
    /**
     * Handle panel close
     */
    handlePanelClose(event) {
        event.preventDefault();
        event.stopPropagation();
        this.closePanel();
    }
    
    /**
     * Handle outside click to close panel
     */
    handleOutsideClick(event) {
        if (!this.isOpen) return;
        
        const sidePanel = this.elements.sidePanel;
        const openBtn = this.elements.sidePanelOpenBtn;
        
        if (sidePanel && !sidePanel.contains(event.target) && 
            openBtn && !openBtn.contains(event.target)) {
            this.closePanel();
        }
    }
    
    /**
     * Handle go to options button click
     */
    handleGoToOptions(event) {
        event.preventDefault();
        
        try {
            if (chrome.runtime.openOptionsPage) {
                // New way to open options pages, if supported (Chrome 42+)
                chrome.runtime.openOptionsPage();
            } else {
                // Reasonable fallback
                window.open(chrome.runtime.getURL('/src/options/index.html'));
            }
        } catch (error) {
            console.error('[SidePanel] Error opening options page:', error);
        }
    }
    
    /**
     * Open the side panel
     */
    openPanel() {
        if (!this.elements.sidePanel) return;
        
        this.elements.sidePanel.classList.add('open');
        this.isOpen = true;
        
        // Update body class
        document.body.classList.add('side-panel-open');
        document.body.classList.remove('side-panel-closed');
        
        console.log('[SidePanel] Panel opened');
    }
    
    /**
     * Close the side panel
     */
    closePanel() {
        if (!this.elements.sidePanel) return;
        
        this.elements.sidePanel.classList.remove('open');
        this.isOpen = false;
        
        // Update body class
        document.body.classList.remove('side-panel-open');
        document.body.classList.add('side-panel-closed');
        
        console.log('[SidePanel] Panel closed');
    }
    
    /**
     * Toggle panel state
     */
    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }
    
    /**
     * Update search terms display
     */
    updateSearchTerms(searchTerms) {
        if (!this.elements.searchTerms) return;
        
        if (!searchTerms || searchTerms.length === 0) {
            this.setText(this.elements.searchTerms, 'All objects in the collection');
        } else {
            // Format search terms for display
            const formattedTerms = this.formatSearchTerms(searchTerms);
            this.setText(this.elements.searchTerms, formattedTerms);
        }
    }
    
    /**
     * Format search terms for display
     */
    formatSearchTerms(searchTerms) {
        if (Array.isArray(searchTerms)) {
            return searchTerms.join(', ');
        } else if (typeof searchTerms === 'string') {
            return searchTerms;
        } else {
            return 'All objects in the collection';
        }
    }
    
    /**
     * Load search terms from storage and update display
     */
    async loadSearchTerms() {
        try {
            if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
                const result = await new Promise((resolve) => {
                    chrome.storage.sync.get(['searchTerms'], resolve);
                });
                
                if (result.searchTerms) {
                    this.updateSearchTerms(result.searchTerms);
                } else {
                    this.updateSearchTerms([]);
                }
            }
        } catch (error) {
            console.error('[SidePanel] Error loading search terms:', error);
            this.updateSearchTerms([]);
        }
    }
    
    /**
     * Update about information
     */
    updateAboutInfo(info = {}) {
        const defaultInfo = {
            title: 'About',
            description: 'Cole is an experiment in search and discovery — made by product designers Alex Charlton and Gala Jover, with the kind support of the V&A museum.',
            contact: {
                email: 'hello@cole-extension.com',
                twitter: 'https://twitter.com/cole_extension',
                chromeStore: 'https://chrome.google.com/webstore/detail/cole/oaalhdkppdbffcjmlmdlmhdlfbingkga'
            },
            links: {
                alexTwitter: 'https://twitter.com/_____alexc',
                galaWebsite: 'https://gjover.com',
                vaTwitter: 'https://twitter.com/V_and_A'
            }
        };
        
        const aboutInfo = { ...defaultInfo, ...info };
        
        // Update about section if it exists
        const aboutSection = this.elements.sidePanel?.querySelector('.text-content');
        if (aboutSection) {
            const aboutHTML = this.buildAboutHTML(aboutInfo);
            const aboutElement = aboutSection.querySelector('h4 + p');
            if (aboutElement) {
                this.setHTML(aboutElement, aboutHTML);
            }
        }
    }
    
    /**
     * Build about section HTML
     */
    buildAboutHTML(info) {
        return `
            ${info.description.replace(
                'Alex Charlton', 
                `<a href="${info.links.alexTwitter}" target="_blank">Alex Charlton</a>`
            ).replace(
                'Gala Jover', 
                `<a href="${info.links.galaWebsite}" target="_blank">Gala Jover</a>`
            ).replace(
                'V&A museum', 
                `<a href="${info.links.vaTwitter}" target="_blank">V&A museum</a>`
            )}
        `;
    }
    
    /**
     * Update contact information
     */
    updateContactInfo(contact = {}) {
        const defaultContact = {
            email: 'hello@cole-extension.com',
            twitter: 'https://twitter.com/cole_extension',
            chromeStore: 'https://chrome.google.com/webstore/detail/cole/oaalhdkppdbffcjmlmdlmhdlfbingkga'
        };
        
        const contactInfo = { ...defaultContact, ...contact };
        
        // Update contact section if it exists
        const contactSection = this.elements.sidePanel?.querySelector('.text-content');
        if (contactSection) {
            const contactHTML = this.buildContactHTML(contactInfo);
            const contactElement = contactSection.querySelector('h4:contains("Get in touch") + p');
            if (contactElement) {
                this.setHTML(contactElement, contactHTML);
            }
        }
    }
    
    /**
     * Build contact section HTML
     */
    buildContactHTML(contact) {
        return `
            Send your feedback to <a href="mailto:${contact.email}">${contact.email}</a><br>
            Follow us on <a href="${contact.twitter}" target="_blank">Twitter</a><br>
            Leave a review on the <a href="${contact.chromeStore}" target="_blank">Chrome webstore</a>
        `;
    }
    
    /**
     * Check if panel is open
     */
    isPanelOpen() {
        return this.isOpen;
    }
    
    /**
     * Get panel element
     */
    getPanelElement() {
        return this.elements.sidePanel;
    }
    
    /**
     * Initialize with default content
     */
    async afterInit() {
        // Load search terms from storage
        await this.loadSearchTerms();
        
        // Update about and contact info
        this.updateAboutInfo();
        this.updateContactInfo();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidePanelComponent;
} else if (typeof window !== 'undefined') {
    window.SidePanelComponent = SidePanelComponent;
} 