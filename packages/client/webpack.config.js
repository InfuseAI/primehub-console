const antdTheme = require('./package.json').theme;
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const tsImportPluginFactory = require('ts-import-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {externals, resolve} = require('./webpack.settings');
const path = require('path');
const webpack = require('webpack');
const devMode = process.env.NODE_ENV !== 'production';
const CompressionPlugin = require('compression-webpack-plugin');
const { ESBuildPlugin } = require('esbuild-loader');

resolve.alias['index-schema'] = path.resolve(__dirname, 'schema/ee/index.schema.js');

module.exports = {
  entry: {
    index: devMode ? './src/ee/index.tsx' : ['./src/public-import.js', './src/ee/index.tsx'],
    'main': devMode ? './src/ee/main.tsx' : ['./src/public-import.js', './src/ee/main.tsx'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: devMode ? 'http://localhost:8090/' : ''
  },
  mode: devMode ? 'development' : 'production',
  externals,
  resolve,
  devServer: {
    port: "8090",
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: {
      rewrites: [
        { from: /^\/g/, to: '/main.html' },
        { from: /^\/app-prefix\/g/, to: '/main.html' },
        { from: /./, to: '/index.html' }
      ]
    },
    https: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2015'
        }
      },
      {
        test: /(\.schema\.js|canner\.def\.js)$/,
        use: [{
          loader: "canner-schema-loader"
        }, {
          loader: "babel-loader"
        }]
      }, {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }, {
        test: /\.css$/,
        use: ['style-loader', "css-loader"]
      }, {
        test: /\.less$/,
        loader: 'ignore-loader'
      }, {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      }
    ]
  },
  plugins: [
    new ESBuildPlugin(),
    new HtmlWebPackPlugin({
      chunks: ['index'],
      template: 'docs/index.html',
      filename: 'index.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['main'],
      template: 'docs/index.html',
      filename: 'main.html'
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      modelDeploymentOnly: false
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: devMode ? 'server' : 'disabled',
      openAnalyzer: false
    }),
    new CompressionPlugin()
  ]
};
