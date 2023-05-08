var webpack = require('webpack');
const path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
  
/*
 * Default webpack configuration for development
 */
var config = {
  entry: [path.join(__dirname, './app/App.js'),'font-awesome-webpack'],
  output: {
    path: path.join(__dirname, "./public"),
    filename: "bundle.js"
  },
  resolve: {
    root:[
      path.join(__dirname, './app/feature/'),
      path.join(__dirname, './app/component/'),
      path.join(__dirname, './app/service/'),
      path.join(__dirname, './app/'),
      path.join(__dirname, './app/style/'),
      path.join(__dirname, './app/store/'),
    ],
    modulesDirectories: [
      
      'node_modules'
    ],
    alias: {
      // models: path.join(__dirname, '../src/client/assets/javascripts/models')
    },
    extensions: ['.js', '.jsx', '.json','.less','','css']
  },
  plugins:[
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch',  // fetch API
      'd3': 'd3',  // fetch API
    }),
    // new ExtractTextPlugin('[name].[hash].css'),
    // Shared code
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   filename: 'js/vendor.bundle.js',
    //   minChunks: Infinity
    // }),
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        presets: ['es2015','react'],
        "env": {
          "development": {
            "presets": ["react-hmre"]
          }
        },
        "plugins": [
          "transform-decorators-legacy",
          "transform-class-properties",
          "transform-runtime",
          // "react-hot-loader/babel",
        ]
      }
    },{
      //less loader
      test: /\.less$/,
      loader: 'style!css!less'
    },{
      test: /\.css$/,
      // Reference: https://github.com/webpack/extract-text-webpack-plugin
      // Extract css files in production builds
      //
      // Reference: https://github.com/webpack/style-loader
      // Use style-loader in development for hot-loading
      loader: 'style-loader!css-loader'
    },{
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&mimetype=application/font-woff'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file-loader'
    },{
      // ASSET LOADER
      // Reference: https://github.com/webpack/file-loader
      // Copy png, jpg, jpeg, gif, svg, woff, woff2, ttf, eot files to output
      // Rename the file using the asset hash
      // Pass along the updated reference to your code
      // You can add here any file extension you want to get copied to your output
      // Han: font files are overriden at the top, because it did not work with font-awesome
      test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
      loader: 'file'
    }, {
      // HTML LOADER
      // Reference: https://github.com/webpack/raw-loader
      // Allow loading html through js
      test: /\.html$/,
      loader: 'raw'
    }]
  },
  devServer: {
    contentBase: "./public",
    colors: true,
    historyApiFallback: true,
    inline: true
  },
}

/*
 * If bundling for production, optimize output
 */
if (process.env.NODE_ENV === 'production') {
  config.devtool = false;
  config.plugins = config.plugins.concat([
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({comments: false}),
    new webpack.DefinePlugin({
      'process.env': {NODE_ENV: JSON.stringify('production')}
    })
  ]);
}else{
  config.devtool = 'source-map';
}

module.exports = config;