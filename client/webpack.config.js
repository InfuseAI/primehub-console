const antdTheme = require('./package.json').theme;
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const tsImportPluginFactory = require('ts-import-plugin');
const path = require('path');

const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
  entry: {
    index: './src/index.tsx'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: devMode ? 'https://localhost:8090/' : ''
  },
  mode: devMode ? 'development' : 'production',
  externals: {
    'react': "React",
    'react-dom': "ReactDOM",
    'antd': 'antd',
    'lodash': '_',
    'firebase': 'firebase',
    'immutable': 'Immutable',
    'styled-components': 'styled',
    'canner-slate-editor': 'CannerSlateEditor'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    alias: {
      'styled-components': path.resolve(__dirname, 'node_modules', 'styled-components'),
      styledShare: path.resolve(__dirname, 'src/styled_share'),
      utils: path.resolve(__dirname, 'src/utils'),
      images: path.resolve(__dirname, 'src/images'),
      components: path.resolve(__dirname, 'src/components')
    }
  },
  devServer: {
    port: "8090",
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true,
    https: true
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
      template: 'docs/index.html'
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name].[hash].css',
      chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
    })
  ]
};