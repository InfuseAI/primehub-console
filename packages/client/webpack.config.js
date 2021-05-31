const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const tsImportPluginFactory = require('ts-import-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const { theme } = require('./package.json');

function getPlugins(env) {
  const { mode: currEnv } = env;

  const isDev = currEnv === 'development';
  const isAnalyze = env.analyze || false;

  const common = [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebPackPlugin({
      chunks: ['cms'],
      template: '!!raw-loader!public/index.html',
      filename: 'cms.ejs',
    }),
    new HtmlWebPackPlugin({
      chunks: ['main'],
      template: '!!raw-loader!public/index.html',
      filename: 'index.ejs',
    }),
    new FaviconsWebpackPlugin({
      logo: './public/icon.svg',
      favicons: {
        appName: 'PrimeHub',
        appDescription:
          'An all-in-one machine learning platform for enterprises in a single click.',
        developerName: 'InfuseAI',
      },
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      modelDeploymentOnly: false,
      primehubCE: false,
    }),
    new MiniCssExtractPlugin({
      filename: isDev ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: isDev ? '[id].css' : '[id].[contenthash].css',
    }),
  ];

  let plugins = {
    development: [...common],
    production: [...common, new CompressionPlugin()],
  };

  if (isAnalyze) {
    plugins.development = [
      ...plugins.development,
      new BundleAnalyzerPlugin({ analyzerMode: 'server' }),
    ];
  }

  return plugins[currEnv];
}

function getSchema(env) {
  const schema = env.schema || 'ce';
  const schemaMap = {
    ee: path.resolve(__dirname, 'schema/ee/index.schema.js'),
    ce: path.resolve(__dirname, 'schema/index.ce.schema.js'),
    modelDeploy: path.resolve(
      __dirname,
      'schema/ee/index.model_deploy.schema.js'
    ),
  };

  return schemaMap[schema];
}

module.exports = (env) => {
  const { mode: currentEnv } = env;

  const stylesLoader = [MiniCssExtractPlugin.loader, 'css-loader'];
  const configs = {
    development: {
      mode: 'development',
      devtool: 'inline-source-map',
      entry: {
        cms: './src/ee/index.tsx',
        main: './src/ee/main.tsx',
      },
    },
    production: {
      mode: 'production',
      devtool: 'hidden-source-map',
      entry: {
        cms: ['./src/public-import.js', './src/ee/index.tsx'],
        main: ['./src/public-import.js', './src/ee/main.tsx'],
      },
    },
  };

  return {
    stats: 'minimal',
    context: path.resolve(process.cwd()),
    mode: configs[currentEnv].mode,
    devtool: configs[currentEnv].devtool,
    entry: configs[currentEnv].entry,
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: '/',
    },
    resolve: {
      extensions: ['.js', 'jsx', '.ts', '.tsx', '.graphql'],
      alias: {
        styledShare: path.resolve(__dirname, 'src/styled_share'),
        utils: path.resolve(__dirname, 'src/utils'),
        images: path.resolve(__dirname, 'src/images'),
        components: path.resolve(__dirname, 'src/components'),
        containers: path.resolve(__dirname, 'src/containers'),
        'cms-layouts': path.resolve(__dirname, 'src/cms-layouts'),
        'cms-components': path.resolve(__dirname, 'src/cms-components'),
        context: path.resolve(__dirname, 'src/context'),
        ee: path.resolve(__dirname, 'src/ee'),
        constant: path.resolve(__dirname, 'src/constant'),
        interfaces: path.resolve(__dirname, 'src/interfaces'),
        root: path.resolve(__dirname, 'src'),
        queries: path.resolve(__dirname, 'src/queries'),
        schema: path.resolve(__dirname, 'schema'),
        'index-schema': getSchema(env),
      },
    },
    devServer: {
      hot: true,
      port: '8090',
      stats: 'minimal',
      contentBase: path.join(__dirname, 'dist'),
      historyApiFallback: {
        rewrites: [
          { from: /^\/g/, to: '/index.html' },
          { from: /^\/app-prefix\/g/, to: '/index.html' },
          { from: /./, to: '/cms.html' },
        ],
      },
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
          test: /\.(graphql|gql)$/i,
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
          test: /\.css$/i,
          use: stylesLoader,
        },
        {
          test: /\.less$/i,
          use: [
            ...stylesLoader,
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  modifyVars: theme,
                },
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: getPlugins(env),
  };
};
