const path = require('path');
const {externals} = require('./webpack.settings');
const webpack = require('webpack');

module.exports = {
  entry: {
    index: './src/index.tsx'
  },
  externals,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: 'https://localhost:8090/docs/static/'
  },
  devServer: {
    port: "8090",
    contentBase: path.join(__dirname, 'docs'),
    historyApiFallback: true
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
  resolveLoader: {
    moduleExtensions: ['-loader']
  },
  plugins: [
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
