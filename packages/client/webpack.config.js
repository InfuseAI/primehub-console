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

resolve.alias['index-schema'] = path.resolve(__dirname, 'schema/ee/index.schema.js');

module.exports = {
  entry: {
    index: devMode ? './src/index.tsx' : ['./src/public-import.js', './src/index.tsx'],
    'new-entry': './src/ee/new-entry.tsx',
    landing: './src/landing.tsx',
    job: devMode ? './src/ee/job.tsx' : ['./src/public-import.js', './src/ee/job.tsx'],
    'model-deployment': devMode ? './src/ee/modelDeployment.tsx' : ['./src/public-import.js', './src/ee/modelDeployment.tsx'],
    'api-token': './src/apiToken.tsx',
    'hub': './src/hub.tsx',
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
        { from: /^\/app-prefix\/job/, to: '/job.html' },
        { from: /^\/job/, to: '/job.html' },
        { from: /^\/app-prefix\/schedule/, to: '/job.html' },
        { from: /^\/schedule/, to: '/job.html' },
        { from: /^\/app-prefix\/landing/, to: '/landing.html' },
        { from: /^\/new-entry$/, to: '/new-entry.html' },
        { from: /^\/landing$/, to: '/landing.html' },
        { from: /^\/model-deployment/, to: '/model-deployment.html' },
        { from: /^\/app-prefix\/model-deployment/, to: './model-deployment.html' },
        { from: /^\/api-token$/, to: '/api-token.html' },
        { from: /^\/app-prefix\/api-token$/, to: './api-token.html' },
        { from: /^\/hub$/, to: '/hub.html' },
        { from: /^\/app-prefix\/hub$/, to: './hub.html' },
        { from: /./, to: '/index.html' }
      ]
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: 'es2015'
          },
          getCustomTransformers: () => ({
            before: [tsImportPluginFactory({
              libraryName: 'antd',
              style: true,
            })]
          }),
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
        use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, "css-loader"]
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
    new HtmlWebPackPlugin({
      chunks: ['index'],
      template: 'docs/index.html',
      filename: 'index.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['new-entry'],
      template: 'docs/index.html',
      filename: 'new-entry.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['landing'],
      template: 'docs/index.html',
      filename: 'landing.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['job'],
      template: 'docs/index.html',
      filename: 'job.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['model-deployment'],
      template: 'docs/index.html',
      filename: 'model-deployment.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['api-token'],
      template: 'docs/index.html',
      filename: 'api-token.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['hub'],
      template: 'docs/index.html',
      filename: 'hub.html'
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
