const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      // Main scripts - using new module structure
      'scripts': [
        './src/main.js'
      ],
      // Plugins - separate bundle as in Grunt
      'plugins': './assets/plugins/index.js',
      // CSS compilation - temporarily disabled for testing
      // 'main': './assets/sass/main.scss'
    },
    
    output: {
      path: isProduction ? path.resolve(__dirname, 'cole/js/min') : path.resolve(__dirname, 'cole/js/max'),
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
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ]
        }
      ]
    },
    
    plugins: [
      new MiniCssExtractPlugin({
        filename: isProduction ? '../css/min/[name].css' : '../css/max/[name].css'
      })
    ],
    
    optimization: {
      minimize: isProduction, // Minify in production mode
      minimizer: isProduction ? [
        new TerserPlugin({
          terserOptions: {
            compress: {
              // drop_console: false // Keep console.log for debugging
            },
            mangle: true,
            format: {
              beautify: false
            }
          }
        })
      ] : [],
      concatenateModules: true
    },
    
    devtool: isProduction ? false : 'source-map',
    
    resolve: {
      extensions: ['.js', '.scss']
    },
    
    watch: !isProduction,
    watchOptions: {
      ignored: /node_modules/
    }
  };
}; 