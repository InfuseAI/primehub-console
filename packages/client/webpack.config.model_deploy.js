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

resolve.alias['index-schema'] = path.resolve(__dirname, 'schema/ee/index.model_deploy.schema.js');

module.exports = {
  entry: {
    cms: devMode ? './src/index.tsx' : ['./src/public-import.js', './src/index.tsx'],
    landing: './src/landing.tsx',
    'main': devMode ? './src/ee/main.model_deploy.tsx' : ['./src/public-import.js', './src/ee/main.model_deploy.tsx'],
    'model-deployment': devMode ? './src/ee/modelDeployment.tsx' : ['./src/public-import.js', './src/ee/modelDeployment.tsx'],
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
        { from: /^\/landing$/, to: '/landing.html' },
        { from: /^\/app-prefix\/landing/, to: '/landing.html' },
        { from: /^\/model-deployment/, to: '/model-deployment.html' },
        { from: /^\/app-prefix\/model-deployment/, to: '/model-deployment.html' },

        { from: /./, to: '/index.html' }
      ]
    },
    https: false
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
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
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
      chunks: ['landing'],
      template: 'docs/index.html',
      filename: 'landing.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['main'],
      template: 'docs/index.html',
      filename: 'main.html'
    }),
    new HtmlWebPackPlugin({
      chunks: ['model-deployment'],
      template: 'docs/index.html',
      filename: 'model-deployment.html'
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      modelDeploymentOnly: true,
      primehubCE: false
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
