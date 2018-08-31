const path = require('path');
const {externals, resolve} = require('./webpack.settings');
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
  resolveLoader: {
    moduleExtensions: ['-loader']
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: 'antd.css'
    })
  ],
  module: {
    rules: [
      // .ts, .tsx
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {
            module: 'es2015'
          }
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
