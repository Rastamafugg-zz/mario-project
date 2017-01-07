var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var DEVELOPMENT = "development";
var PRODUCTION = "production";

var environment = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : DEVELOPMENT;

var publicPath = (environment === PRODUCTION) ? '/' : '/';
var absolutePath = path.join(__dirname, 'build');

var config = {
  output: {
    path: absolutePath,
    filename: 'bundle.js',
    publicPath: publicPath
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [ 'babel' ],
        exclude: /node_modules/,
        include: path.join(__dirname, 'src')
      },
      // fonts and svg
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
      {
        // images
        test: /\.(ico|jpe?g|png|gif)$/,
        loader: "file"
      },
      {
        // for some modules like foundation
        test: /\.scss$/,
        exclude: [/node_modules/], // sassLoader will include node_modules explicitly
        loader: ExtractTextPlugin.extract("style", "css!postcss!sass?outputStyle=expanded")
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style", "css!postcss")
      }
    ]
  },
  postcss: function(webpack) {
    return [
      autoprefixer({browsers: ['last 2 versions', 'ie >= 9', 'and_chr >= 2.3']})
    ]
  },
  sassLoader: {
    includePaths: [path.resolve(__dirname, "node_modules")]
  }
};

if (environment === DEVELOPMENT) {
  console.log("Loading development configuration...");
  config.devtool = 'eval-source-map';
  config.entry = [
    './src/index'
  ];
  config.plugins = [
    new webpack.DefinePlugin({
      'process.env':{
        'NODE_ENV': JSON.stringify(DEVELOPMENT) // Development setting
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    // new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin("bundle.css")
  ];

} else if (environment === PRODUCTION) {
  console.log("Loading production configuration...");
  config.entry = [
    './src/index'
  ];
  config.plugins = [
    new webpack.DefinePlugin({
      'process.env':{
        'NODE_ENV': JSON.stringify(PRODUCTION) // Production setting
      }
    }),
    new webpack.optimize.UglifyJsPlugin({ // Production plugin, comment out for development build
      compress:{
        warnings: true
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin("bundle.css")
  ];

} else {
  console.error("ERROR: could not determine build environment: %s", environment);
}

module.exports = config;
