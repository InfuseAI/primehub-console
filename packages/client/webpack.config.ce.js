const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const tsImportPluginFactory = require('ts-import-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const { externals, resolve } = require('./webpack.settings');
const path = require('path');
const webpack = require('webpack');
const devMode = process.env.NODE_ENV !== 'production';
const CompressionPlugin = require('compression-webpack-plugin');

resolve.alias['index-schema'] = path.resolve(
  __dirname,
  'schema/index.ce.schema.js'
);

module.exports = {
  entry: {
    cms: devMode
      ? './src/index.tsx'
      : ['./src/public-import.js', './src/index.tsx'],
    main: devMode
      ? './src/main.ce.tsx'
      : ['./src/public-import.js', './src/main.ce.tsx'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: devMode ? 'http://localhost:8090/' : '',
  },
  mode: devMode ? 'development' : 'production',
  externals,
  resolve,
  devServer: {
    port: '8090',
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: {
      rewrites: [
        { from: /^\/g/, to: '/index.html' },
        { from: /^\/app-prefix\/g/, to: '/index.html' },
        { from: /./, to: '/cms.html' },
      ],
    },
    https: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: 'es2015',
          },
          getCustomTransformers: () => ({
            before: [
              tsImportPluginFactory({
                libraryName: 'antd',
                style: true,
              }),
            ],
          }),
        },
      },
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
      {
        test: /(\.schema\.js|canner\.def\.js)$/,
        use: [
          {
            loader: 'canner-schema-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.less$/,
        loader: 'ignore-loader',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      chunks: ['cms'],
      template: 'docs/index.html',
      filename: 'cms.html',
    }),
    new HtmlWebPackPlugin({
      chunks: ['main'],
      template: 'docs/index.html',
      filename: 'index.html',
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      modelDeploymentOnly: false,
      primehubCE: true,
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: devMode ? 'server' : 'disabled',
      openAnalyzer: false,
    }),
    new CompressionPlugin(),
  ],
};
