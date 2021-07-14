const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const tsImportPluginFactory = require('ts-import-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const { theme } = require('./package.json');

function getPlugins(env) {
  const { mode: currentEnv, schema } = env;

  const isDev = currentEnv === 'development';
  const isAnalyze = env.analyze || false;

  const htmlWebpackPluginConfig = {
    template: isDev ? 'public/index.html' : '!!raw-loader!public/index.ejs',
    templateParameters: {
      title: isDev ? '[Dev] PrimeHub' : 'PrimeHub',
    },
    favicon: isDev ? 'public/icon.svg' : '',
  };
  const common = [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebPackPlugin({
      ...htmlWebpackPluginConfig,
      chunks: ['admin'],
      filename: isDev ? 'admin.html' : 'admin.ejs',
    }),
    new HtmlWebPackPlugin({
      ...htmlWebpackPluginConfig,
      chunks: ['main'],
      filename: isDev ? 'index.html' : 'index.ejs',
    }),
    new HtmlWebPackPlugin({
      chunks: ['login'],
      template: '!!raw-loader!public/login.ejs',
      filename: 'login.ejs',
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      modelDeploymentOnly: schema === 'modelDeploy',
      primehubCE: schema === 'ce',
      __ENV__: JSON.stringify(schema),
    }),
    new MiniCssExtractPlugin({
      filename: isDev ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: isDev ? '[id].css' : '[id].[contenthash].css',
    }),
  ];

  let plugins = {
    development: [...common],
    production: [
      ...common,
      new HtmlWebPackPlugin({
        chunks: ['login'],
        template: '!!raw-loader!public/login.ejs',
        filename: 'login.ejs',
      }),
      new CompressionPlugin(),
    ],
  };

  if (isAnalyze) {
    plugins.development = [
      ...plugins.development,
      new BundleAnalyzerPlugin({ analyzerMode: 'server' }),
    ];
  }

  return plugins[currentEnv];
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

function getEntry(env) {
  const version = env.schema || 'ce';
  const entryMap = {
    ee: path.resolve(__dirname, 'src/ee/main.tsx'),
    ce: path.resolve(__dirname, 'src/main.ce.tsx'),
    modelDeploy: path.resolve(__dirname, 'src/ee/main.model_deploy.tsx'),
  };

  return entryMap[version];
}

module.exports = (env) => {
  const { mode: currentEnv } = env;
  const isDev = currentEnv === 'development';
  const entryPage = getEntry(env);

  const stylesLoader = [MiniCssExtractPlugin.loader, 'css-loader'];
  const configs = {
    development: {
      mode: 'development',
      devtool: 'eval-cheap-source-map',
      entry: {
        admin: './src/admin.tsx',
        main: entryPage,
      },
    },
    production: {
      mode: 'production',
      devtool: false,
      entry: {
        admin: ['./src/public-import.js', './src/admin.tsx'],
        main: ['./src/public-import.js', entryPage],
      },
    },
  };

  return {
    context: path.resolve(process.cwd()),
    mode: configs[currentEnv].mode,
    devtool: configs[currentEnv].devtool,
    entry: configs[currentEnv].entry,
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: isDev ? '/' : '<%= staticPath %>',
    },
    optimization: {
      minimize: false,
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
        'cms-toolbar': path.resolve(__dirname, 'src/cms-toolbar'),
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
      contentBase: path.join(__dirname, 'dist'),
      historyApiFallback: {
        rewrites: [
          { from: /^\/g/, to: '/index.html' },
          { from: /^\/app-prefix\/g/, to: '/index.html' },
          { from: /./, to: '/admin.html' },
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
              loader: 'babel-loader?cacheDirectory',
            },
          ],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader?cacheDirectory',
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
