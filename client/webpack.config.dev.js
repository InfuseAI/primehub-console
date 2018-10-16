const path = require('path');
const {externals} = require('./webpack.settings');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const tsImportPluginFactory = require('ts-import-plugin');
// const AntDesignThemePlugin = require('antd-theme-webpack-plugin');
// const options = {
//   antDir: path.join(__dirname, './node_modules/antd'),
//   stylesDir: path.join(__dirname, './src/styles'),
//   varFile: path.join(__dirname, './src/styles/variables.less'),
//   mainLessFile: path.join(__dirname, './src/styles/index.less'),
//   themeVariables: ['@primary-color'],
//   indexFileName: 'index.html'
// }
 
// const themePlugin = new AntDesignThemePlugin(options);

module.exports = {
  entry: {
    index: './src/index.tsx'
  },
  externals,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: 'https://localhost:8090/'
  },
  devServer: {
    port: "8090",
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    alias: {
      'styled-components': path.resolve(__dirname, 'node_modules', 'styled-components'),
      'antd': path.resolve(__dirname, 'node_modules', 'antd'),
      styledShare: path.resolve(__dirname, 'src/styled_share'),
      utils: path.resolve(__dirname, 'src/utils'),
      images: path.resolve(__dirname, 'src/images'),
      components: path.resolve(__dirname, 'src/components')
    }
  },
  resolveLoader: {
    moduleExtensions: ['-loader']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'docs/index.html'
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
        test: /\.schema\.js|canner\.def\.js$/,
        use: [
          {
            loader: 'canner-schema-loader',
          },
          {
            loader: 'babel-loader',
            options: {
              presets: [
                require('@babel/preset-env'),
                require('@babel/preset-react'),
                require('@babel/preset-stage-0'),
              ],
            },
          }
        ],
      },
      {
        exclude: /node_modules/,
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                require('@babel/preset-env'),
                require('@babel/preset-react'),
                require('@babel/preset-stage-0'),
              ],
              plugins: [[
                "import", {
                  libraryName: 'antd',
                  style: true
                }
              ]]
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [{
          loader: 'style-loader' // creates style nodes from JS strings
        }, {
          loader: 'css-loader' // translates CSS into CommonJS
        }]
      },
      {
        test: /\.less$/,
        loader: 'ignore-loader'
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      }
    ]
  }
};
