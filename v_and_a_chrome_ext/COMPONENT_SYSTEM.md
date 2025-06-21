# Component System Documentation

## Overview

The Chrome extension has been refactored to use a modular component system for better maintainability, extensibility, and code organization. This replaces the previous monolithic approach with a clean, component-based architecture.

## Architecture

### Component Hierarchy

```
ComponentManager
├── ObjectDisplayComponent
├── HistoryComponent
└── SidePanelComponent
```

### Base Component

All components extend the `BaseComponent` class which provides:

- **Lifecycle Management**: `init()`, `destroy()`, `beforeInit()`, `afterInit()`
- **Event Handling**: Safe event binding with automatic cleanup
- **DOM Utilities**: Safe element manipulation methods
- **Error Handling**: Centralized error handling and logging

### Component Manager

The `ComponentManager` orchestrates all components and provides:

- **Central Initialization**: Manages component initialization order
- **Component Communication**: Handles inter-component communication
- **State Management**: Centralized state management
- **Public API**: Clean interface for external code

## Components

### 1. ObjectDisplayComponent

Handles the main object display functionality:

**Features:**
- Object image and metadata display
- Title, artist, and date information
- Technical details and descriptions
- Image loading and error states
- Pinterest and Twitter sharing URLs

**Key Methods:**
- `updateDisplay(objectData)` - Update display with new object data
- `showLoading()` / `hideLoading()` - Manage loading states
- `clear()` - Clear the display

### 2. HistoryComponent

Manages the history functionality:

**Features:**
- Display previously viewed objects
- History overlay management
- Chrome storage integration
- History object interactions

**Key Methods:**
- `addToHistory(objectData)` - Add object to history
- `showHistory()` / `hideHistory()` - Manage history overlay
- `getHistory()` - Get history array
- `clearHistory()` - Clear all history

### 3. SidePanelComponent

Manages the side panel functionality:

**Features:**
- About information display
- Search terms display
- Settings navigation
- Panel open/close animations

**Key Methods:**
- `openPanel()` / `closePanel()` - Manage panel state
- `updateSearchTerms(searchTerms)` - Update search terms display
- `updateAboutInfo(info)` - Update about information

## Usage

### Initialization

```javascript
// Create component manager
const componentManager = new ComponentManager({
    maxHistoryItems: 10,
    objectDisplay: { /* options */ },
    history: { /* options */ },
    sidePanel: { /* options */ }
});

// Initialize all components
await componentManager.init();
```

### Updating Object Display

```javascript
// Update with new object data
await componentManager.updateObjectDisplay(objectData);

// Show/hide loading states
componentManager.showLoading();
componentManager.hideLoading();
```

### Managing History

```javascript
// Add object to history
await componentManager.addToHistory(objectData);

// Get history data
const history = componentManager.getHistory();

// Clear history
await componentManager.clearHistory();
```

### Managing UI State

```javascript
// Show/hide error state
componentManager.showError();
componentManager.hideError();

// Manage side panel
componentManager.openSidePanel();
componentManager.closeSidePanel();

// Manage history overlay
componentManager.showHistory();
componentManager.hideHistory();
```

## Migration from Monolithic Code

### Before (Monolithic)

```javascript
// Direct DOM manipulation
$("#title").html(objectData.title);
$("#creator-name").text(objectData.artist);
$("#image").attr("src", objectData.imageUrl);

// Manual event handling
$(".history").click(function() {
    // Complex history logic
});

// Manual state management
if ($sidePanel.hasClass('open')) {
    $sidePanel.removeClass('open');
}
```

### After (Component System)

```javascript
// Clean component-based updates
await componentManager.updateObjectDisplay(objectData);

// Automatic event handling
componentManager.showHistory();

// Clean state management
componentManager.openSidePanel();
```

## Benefits

### 1. Maintainability
- **Separation of Concerns**: Each component has a single responsibility
- **Modular Code**: Easy to modify individual components without affecting others
- **Clear Interfaces**: Well-defined APIs for component interaction

### 2. Extensibility
- **Easy to Add Components**: New components can be added without modifying existing code
- **Museum API Support**: Easy to add support for other museum APIs
- **Feature Addition**: New features can be added as separate components

### 3. Testing
- **Unit Testing**: Each component can be tested independently
- **Mock Components**: Easy to create mock components for testing
- **Isolated Logic**: Component logic is isolated and testable

### 4. Performance
- **Lazy Loading**: Components can be loaded on demand
- **Efficient Updates**: Only necessary components are updated
- **Memory Management**: Automatic cleanup prevents memory leaks

## Browser Compatibility

The component system is designed to work with:

- **Chrome Extensions**: Manifest V3 compatible
- **Modern Browsers**: ES6+ features supported
- **Fallback Support**: Graceful degradation for older browsers

## Error Handling

The component system includes comprehensive error handling:

- **Component Initialization**: Errors during component initialization are caught and logged
- **Event Handling**: Event handler errors are isolated and logged
- **API Failures**: API failures are handled gracefully with fallbacks
- **DOM Errors**: DOM manipulation errors are caught and handled safely

## Future Enhancements

### Planned Features

1. **State Management**: Add a proper state management system (Redux-like)
2. **Configuration System**: Add a flexible configuration system
3. **Unit Tests**: Add comprehensive unit tests for all components
4. **Performance Monitoring**: Add performance monitoring and optimization
5. **Accessibility**: Improve accessibility features

### Extension Points

1. **New Museum APIs**: Easy to add support for other museum APIs
2. **UI Themes**: Support for different UI themes and styles
3. **Custom Components**: Framework for creating custom components
4. **Plugin System**: Plugin system for third-party extensions

## File Structure

```
assets/scripts/
├── components/
│   ├── BaseComponent.js
│   ├── ObjectDisplayComponent.js
│   ├── HistoryComponent.js
│   ├── SidePanelComponent.js
│   └── ComponentManager.js
├── 2_main_refactored.js
├── 3_va_api_refactored.js
└── museumApi.js
```

## Contributing

When adding new features or modifying existing components:

1. **Follow Component Pattern**: Extend `BaseComponent` for new components
2. **Use Component Manager**: Register new components with the ComponentManager
3. **Maintain Interfaces**: Keep existing public APIs stable
4. **Add Documentation**: Document new components and features
5. **Test Thoroughly**: Test components individually and as a system 