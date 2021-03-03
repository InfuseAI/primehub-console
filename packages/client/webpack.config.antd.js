const path = require('path');
const {externals, resolve} = require('./webpack.settings');
const { ESBuildPlugin } = require('esbuild-loader');
const {theme} = require('./package.json');
// plugins
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
if (process.env.NODE_ENV === 'development') {
  delete theme['icon-url'];
}
module.exports = {
  mode: 'production',
  entry: './src/antd.less',
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'antd.js',
    publicPath: '/'
  },
  mode: 'production',
  resolveLoader: {
    moduleExtensions: ['-loader']
  },
  performance: {
    hints: false
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: 'antd.css'
    }),
    new ESBuildPlugin()
  ],
  module: {
    rules: [
      // .ts, .tsx
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2015'
        }
      },
      {
        test: /\.less$/,
        use: [{
          loader: MiniCssExtractPlugin.loader
        }, {
          loader: 'css-loader' // translates CSS into CommonJS
        }, {
          loader: 'less-loader',
          options: {
            modifyVars: theme
          }
        }]
      },
      {
        test: /\.(eot|svg|ttf|woff)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/font'
            }
          }
        ]
      }
    ]
  }
};
