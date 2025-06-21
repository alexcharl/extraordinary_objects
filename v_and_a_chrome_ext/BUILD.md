# Build System

This project uses Webpack and Sass for building the Chrome extension.

## Prerequisites

Install dependencies:
```bash
npm install
```

## Development

Start the development build process:
```bash
npm start
```

This will:
1. Build the plugins.js file
2. Watch and compile SASS files
3. Watch and bundle JavaScript files with Webpack

## Build Commands

- `npm run dev` - Build JavaScript in development mode with watch
- `npm run build` - Build JavaScript in production mode
- `npm run build:dev` - Build JavaScript in development mode
- `npm run build:plugins` - Concatenate plugin files
- `npm run sass:dev` - Watch and compile SASS in development mode
- `npm run sass:build` - Build SASS in production mode

## File Structure

- `assets/scripts/` - Source JavaScript files (bundled by Webpack)
- `assets/plugins/` - Plugin files (concatenated by build script)
- `assets/sass/` - Source SASS files (compiled by Sass)
- `cole/js/max/` - Development JavaScript output
- `cole/js/min/` - Production JavaScript output (not yet implemented)
- `cole/css/max/` - Development CSS output
- `cole/css/min/` - Production CSS output

## Migration from Grunt

This build system replaces the previous Grunt-based build:
- Webpack replaces grunt-contrib-uglify for JavaScript bundling
- Sass CLI replaces grunt-contrib-compass for CSS compilation
- Custom script replaces grunt-contrib-uglify for plugin concatenation

The output files maintain the same structure and naming as the previous build system. 