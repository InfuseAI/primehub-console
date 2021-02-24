
const path = require('path');

module.exports = {
  externals: {
    'react': "React",
    'react-dom': "ReactDOM",
    'antd': 'antd',
    'lodash': '_',
    'immutable': 'Immutable',
    'styled-components': 'styled',
    'canner-slate-editor': 'CannerSlateEditor',
    'moment': 'moment'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    alias: {
      'styled-components': path.resolve(__dirname, 'node_modules', 'styled-components'),
      styledShare: path.resolve(__dirname, 'src/styled_share'),
      utils: path.resolve(__dirname, 'src/utils'),
      images: path.resolve(__dirname, 'src/images'),
      components: path.resolve(__dirname, 'src/components'),
      containers: path.resolve(__dirname, 'src/containers'),
      'cms-layouts': path.resolve(__dirname, 'src/cms-layouts'),
      'cms-components': path.resolve(__dirname, 'src/cms-components'),
      context: path.resolve(__dirname, 'src/context'),
      ee: path.resolve(__dirname, 'src/ee'),
      root: path.resolve(__dirname, 'src'),
      schema: path.resolve(__dirname, 'schema')
    }
  }
}
