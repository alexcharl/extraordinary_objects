# V&A Chrome Extension

A Chrome extension that showcases extraordinary objects from the Victoria and Albert Museum's collection. Built with modern JavaScript, featuring a modular architecture, state management, and comprehensive error handling.

## 🚀 Features

- **Random Object Discovery**: Discover fascinating objects from the V&A collection
- **Object History**: Keep track of objects you've viewed
- **Social Sharing**: Share objects on Pinterest and Twitter
- **Responsive Design**: Works beautifully on all screen sizes
- **Offline Support**: Graceful handling of network issues
- **Error Recovery**: Automatic retry and user-friendly error messages

## 🏗️ Architecture

This extension has been refactored with a modern, maintainable architecture:

### **Build System**
- **Webpack** for modern bundling and development
- **Sass** for maintainable CSS with modern syntax
- **Babel** for JavaScript transpilation

### **State Management**
- **Centralized State**: All application state managed in one place
- **Action-Based Updates**: Predictable state changes through actions
- **Persistence**: State automatically saved to Chrome storage
- **Reactive Components**: UI automatically updates when state changes

### **Component System**
- **Modular Components**: Reusable, self-contained UI components
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
2. Install dependencies:
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

### Error Handling Integration

To integrate the error handling system into your extension:

1. **Initialize the Error Handler** in your main entry point:
   ```javascript
   // In your main script (e.g., 2_main_refactored.js)
   window.errorHandler = new ErrorHandler({
       enableLogging: true,
       enableNotifications: true,
       maxRetries: 3,
       retryDelay: 1000
   });
   
   // Initialize after DOM is ready
   window.errorHandler.init();
   ```

2. **Use Error Handling in API Calls**:
   ```javascript
   // In your API code (e.g., 3_va_api_refactored.js)
   try {
       const data = await museumApi.search(searchParams);
       await processResponse(data, expectResponse);
   } catch (error) {
       window.errorHandler.handleError({
           type: 'api',
           error: error,
           message: 'Failed to fetch object data',
           context: {
               operationId: 'search_objects',
               searchParams: searchParams,
               retryFunction: () => makeVaRequest(systemNumber, searchTerm, offset, limit, withImages, withDescription, after, random)
           },
           retryable: true
       });
   }
   ```

3. **Handle Component Errors**:
   ```javascript
   // In your component code
   try {
       this.updateDisplay(objectData);
   } catch (error) {
       window.errorHandler.handleError({
           type: 'component',
           error: error,
           message: 'Failed to update object display',
           context: {
               componentName: 'ObjectDisplayComponent',
               objectData: objectData
           }
       });
   }
   ```

4. **Handle State Errors**:
   ```javascript
   // In your state management code
   try {
       this.setState(partialState);
   } catch (error) {
       window.errorHandler.handleError({
           type: 'state',
           error: error,
           message: 'Failed to update application state',
           context: {
               partialState: partialState
           }
       });
   }
   ```

### Error Types Supported

- **API Errors**: Network timeouts, server errors, rate limiting
- **Network Errors**: Offline detection, connection issues
- **State Errors**: State corruption, storage issues
- **Component Errors**: UI rendering failures, event handling errors
- **Generic Errors**: Unexpected errors with fallback handling

### Error Recovery Features

- **Automatic Retry**: Retryable errors automatically retried with exponential backoff
- **User Notifications**: Clear, actionable error messages shown to users
- **State Recovery**: Automatic state restoration from Chrome storage
- **Component Reinitialization**: Failed components automatically reinitialized
- **Offline Support**: Graceful handling when network is unavailable

## 🎯 Usage

### Loading the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `cole` folder
4. The extension should now appear in your extensions list

### Using the Extension

1. Click the extension icon in your Chrome toolbar
2. The extension will automatically fetch and display a random object from the V&A collection
3. Use the history button to view previously seen objects
4. Share objects on social media using the provided buttons
5. Access detailed information about each object

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
├── assets/
│   ├── scripts/
│   │   ├── components/          # UI components
│   │   │   ├── state/              # State management
│   │   │   ├── error/              # Error handling
│   │   │   └── *.js               # Core scripts
│   │   ├── sass/                   # Stylesheets
│   │   └── plugins/                # External libraries
│   ├── cole/                       # Built extension
│   ├── webpack.config.js          # Build configuration
│   └── package.json               # Dependencies
```

### Key Files

- **`2_main_refactored.js`**: Main application entry point
- **`3_va_api_refactored.js`**: V&A API integration
- **`museumApi.js`**: API abstraction layer
- **`ErrorHandler.js`**: Error handling system
- **`AppState.js`**: State management
- **`ComponentManager.js`**: Component orchestration

### Adding New Features

1. **New Components**: Extend `BaseComponent` and register in `ComponentManager`
2. **New State**: Add to `AppState` and create corresponding actions
3. **New APIs**: Implement new museum API in the abstraction layer
4. **Error Handling**: Use `ErrorHandler.handleError()` for all error cases

## 🚀 Chrome Web Store Preparation

### Compliance Checklist

- ✅ **Manifest V3**: Extension uses Manifest V3
- ✅ **Self-Contained Code**: All logic contained within extension package
- ✅ **No Remote Code**: No external script execution
- ✅ **Proper API Usage**: Uses V&A API as documented
- ✅ **Data Handling**: No sensitive data collection
- ✅ **Error Handling**: Comprehensive error handling implemented
- ✅ **Testing**: Extension tested for crashes and bugs

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

### Latest Version
- **Error Handling & Resilience**: Comprehensive error handling system
- **State Management**: Centralized state management with persistence
- **Component System**: Modular, reusable UI components
- **API Abstraction**: Extensible museum API support
- **Modern Build System**: Webpack-based build with Sass

### Previous Versions
- **Build System Modernization**: Replaced Grunt with Webpack
- **Sass Modernization**: Updated to modern Sass syntax
- **Initial Refactoring**: Broke down monolithic JavaScript

---

Built with ❤️ for art and design enthusiasts everywhere. 