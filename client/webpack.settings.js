
const path = require('path');

module.exports = {
  externals: {
    'react': "React",
    'react-dom': "ReactDOM",
    'antd': 'antd',
    'lodash': '_',
    'firebase': 'firebase',
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
      components: path.resolve(__dirname, 'src/components')
    }
  }
}