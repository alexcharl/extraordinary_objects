const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      // Main scripts - bundle in the same order as current Grunt setup
      'scripts': [
        './assets/scripts/0_helpers.js',
        './assets/scripts/1_global.js', 
        './assets/scripts/2_main.js',
        './assets/scripts/museumApi.js',  // Add the new museum API abstraction
        './assets/scripts/3_va_api.js',
        './assets/scripts/x_docReady.js'
      ]
    },
    
    output: {
      path: path.resolve(__dirname, 'cole/js/max'),
      filename: '[name].js',
      clean: false // Don't clean the output directory to preserve other files
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    chrome: "88" // Support Chrome extensions
                  }
                }]
              ]
            }
          }
        }
      ]
    },
    
    optimization: {
      minimize: false, // Keep readable for development
      concatenateModules: true
    },
    
    devtool: isProduction ? false : 'source-map',
    
    resolve: {
      extensions: ['.js']
    },
    
    watch: !isProduction,
    watchOptions: {
      ignored: /node_modules/
    }
  };
}; 