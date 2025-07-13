# Cole - V&A Chrome Extension

A Chrome extension that showcases extraordinary objects from the Victoria and Albert Museum's collection. Built with modern JavaScript, featuring a modular architecture, state management, and comprehensive error handling.

## 🚀 Features

- **Random Object Discovery**: Discover fascinating objects from the V&A collection
- **Object History**: Keep track of objects you've viewed
- **Social Sharing**: Share objects on Pinterest and Twitter
- **Responsive Design**: Works beautifully on all screen sizes
- **Offline Support**: Graceful handling of network issues
- **Error Recovery**: Automatic retry and user-friendly error messages
- **Search Customization**: Customize search terms to discover specific types of objects

## 🏗️ Architecture

This extension has been built with a modern, maintainable architecture:

### **Build System**
- **Webpack 5** for modern bundling and development
- **Sass** for maintainable CSS with modern syntax
- **Babel** for JavaScript transpilation
- **Production optimization** with console log removal and minification

### **State Management**
- **Centralized State**: All application state managed in `AppState.js`
- **Promise-based Operations**: Async state operations with proper error handling
- **Persistence**: State automatically saved to Chrome storage
- **Reactive Components**: UI automatically updates when state changes

### **Component System**
- **Modular Components**: Reusable, self-contained UI components in `src/ui/components/`
- **Lifecycle Management**: Proper initialization and cleanup
- **Event Handling**: Centralized event management
- **State Integration**: Components connect to state management

### **API Abstraction**
- **Museum API Factory**: Easy to add support for other museums
- **V&A API Implementation**: Complete V&A Collections API integration
- **Error Handling**: Robust error handling with retry mechanisms

### **Error Handling & Resilience**
- **Comprehensive Error Handling**: Catches and handles all types of errors
- **Automatic Retry**: Exponential backoff for retryable errors
- **User-Friendly Messages**: Clear, actionable error messages
- **Offline Support**: Graceful degradation when offline
- **Error Recovery**: Automatic state recovery and component reinitialization

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. Clone the repository
2. Navigate to the extension directory:
   ```bash
   cd v_and_a_chrome_ext
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development
```bash
# Start development build with watch mode
npm run dev

# Build for production
npm run build

# Build plugins (concatenates external libraries)
npm run build:plugins
```

## 🔧 Configuration

### Extension Settings

The extension can be configured through the Chrome extension options page:
- **Search Terms**: Customize what types of objects to discover
- **Strict Search**: Enable/disable strict matching of search terms
- **History Management**: Clear viewing history

### Error Handling Integration

The extension includes comprehensive error handling that automatically:
- **Retries failed API calls** with exponential backoff
- **Shows user-friendly error messages** when appropriate
- **Recovers from state corruption** by restoring from Chrome storage
- **Handles offline scenarios** gracefully

## 🎯 Usage

### Loading the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `cole` folder from the built extension
4. The extension should now appear in your extensions list

### Using the Extension

1. **New Tab Experience**: The extension replaces your new tab page with V&A objects
2. **Object Discovery**: Each new tab shows a random object from the V&A collection
3. **History**: Click the history icon to view previously seen objects
4. **Sharing**: Use Pinterest and Twitter buttons to share objects
5. **Details**: Click the "more" icon for detailed object information and settings

### Extension Features

- **Automatic Loading**: Objects load automatically when you open a new tab
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Social Integration**: Share objects directly to social media
- **Search Customization**: Modify search terms to discover specific object types
- **History Tracking**: Keep track of your favorite discoveries

## 🏛️ API Integration

The extension integrates with the [V&A Collections API](https://developers.vam.ac.uk/) to fetch object data. The API provides:

- Object metadata (title, artist, date, materials, etc.)
- High-quality images
- Detailed descriptions and context
- Technical information

### API Usage

The extension uses the V&A API responsibly:
- Respects rate limits
- Implements proper error handling
- Caches data appropriately
- Provides attribution as required

## 🔒 Privacy & Data Handling

This extension:

- **Does not collect personal data**
- **Stores only viewing history locally** (Chrome storage)
- **Does not transmit user data** to external servers
- **Uses only the V&A API** for object data
- **Complies with Chrome Web Store policies**

### Data Stored Locally

- Object viewing history (last 10 objects)
- User preferences (search terms, settings)
- Extension state (current object, UI state)

### Data Transmitted

- API requests to V&A Collections API (object data only)
- No user data transmitted

## 🛠️ Development

### Project Structure

```
v_and_a_chrome_ext/
├── src/
│   ├── api/                    # API integration layer
│   │   ├── api-integration.js     # Main API integration
│   │   ├── MuseumApi.js          # Museum API abstraction
│   │   ├── SmithsonianApi.js     # Smithsonian API implementation
│   │   └── VandAApi.js           # V&A API implementation
│   ├── core/                   # Core application logic
│   │   ├── AppState.js           # State management
│   │   └── global.js             # Global utilities
│   ├── plugins/                 # External libraries
│   │   ├── 1_doTimeout_throttle_debounce.js
│   │   ├── 2_imagesloaded.js
│   │   ├── 3_velocity.js
│   │   └── index.js
│   ├── styles/                  # Sass stylesheets
│   │   ├── common/              # Shared styles
│   │   ├── pages/               # Page-specific styles
│   │   └── main.scss            # Main stylesheet
│   ├── ui/                      # UI components
│   │   ├── components/          # Reusable components
│   │   │   ├── HistoryComponent.js
│   │   │   ├── ObjectDisplayComponent.js
│   │   │   ├── OverlayComponent.js
│   │   │   └── SidePanelComponent.js
│   │   └── main.js              # UI initialization
│   ├── utils/                   # Utility functions
│   │   └── helpers.js
│   ├── main.js                  # Main entry point (renamed to scripts-entry.js)
│   └── options/                 # Extension options page
│       ├── index.html
│       └── options.js
├── cole/                        # Built extension
│   ├── src/override/            # New tab override page
│   ├── jquery/                  # jQuery library (v3.7.1)
│   ├── js/                      # Built JavaScript files
│   ├── css/                     # Built CSS files
│   ├── icons/                   # Extension icons
│   └── manifest.json            # Extension manifest
├── webpack.config.js            # Build configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

### Key Files

- **`src/scripts-entry.js`**: Main application entry point
- **`src/api/api-integration.js`**: API integration orchestration
- **`src/api/VandAApi.js`**: V&A API implementation
- **`src/core/AppState.js`**: State management
- **`src/ui/components/`**: UI components
- **`webpack.config.js`**: Build configuration

### Technology Stack

- **jQuery 3.7.1**: DOM manipulation and AJAX
- **Webpack 5**: Module bundling and build system
- **Sass**: CSS preprocessing
- **Chrome Extension APIs**: Storage, tabs, and extension management

### Adding New Features

1. **New Components**: Add to `src/ui/components/` and register in UI initialization
2. **New State**: Add to `AppState.js` and create corresponding methods
3. **New APIs**: Implement new museum API in `src/api/`
4. **Error Handling**: Use try-catch blocks and proper error logging

## 🚀 Chrome Web Store Preparation

### Compliance Checklist

- ✅ **Manifest V3**: Extension uses Manifest V3
- ✅ **Self-Contained Code**: All logic contained within extension package
- ✅ **No Remote Code**: No external script execution
- ✅ **Proper API Usage**: Uses V&A API as documented
- ✅ **Data Handling**: No sensitive data collection
- ✅ **Error Handling**: Comprehensive error handling implemented
- ✅ **Testing**: Extension tested for crashes and bugs
- ✅ **jQuery 3.7.1**: Updated to latest stable jQuery version
- ✅ **Production Build**: Console logs removed from production builds

### Required Files

- **Privacy Policy**: Required for data handling
- **Store Listing**: Description, screenshots, category
- **Developer Information**: Contact details, support information

### Submission Process

1. **Test thoroughly** for all error scenarios
2. **Prepare store listing** with screenshots and description
3. **Create privacy policy** (even if minimal data collection)
4. **Submit for review** through Chrome Web Store Developer Dashboard
5. **Respond to review feedback** if needed

## 📄 License

This project uses the V&A Collections API under their [terms of use](https://www.vam.ac.uk/info/va-websites-terms-conditions).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the error logs in Chrome DevTools
- Review the error handling documentation
- Test with different network conditions
- Verify API availability

## 🔄 Changelog

### Latest Version (Current)
- **jQuery 3.7.1**: Upgraded from jQuery 2.x to latest stable version
- **Production Optimization**: Console logs removed from production builds
- **CSP Compliance**: Fixed Content Security Policy issues
- **Promise Resolution**: Fixed state management Promise handling
- **File Structure**: Cleaned up and organized project structure

### Previous Versions
- **Error Handling & Resilience**: Comprehensive error handling system
- **State Management**: Centralized state management with persistence
- **Component System**: Modular, reusable UI components
- **API Abstraction**: Extensible museum API support
- **Modern Build System**: Webpack-based build with Sass

---

Built with ❤️ for art and design enthusiasts everywhere. 