/** @jsx builder */

import builder from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export const groupColumns = [{
  title: '${name}',
  dataIndex: 'name'
}, {
  title: '${displayName}',
  dataIndex: 'displayName'
}, , {
  title: '${cpuQuota}',
  dataIndex: 'quotaCpu',
  render: text => {
    return text === null ? '∞' : text;
  }
}, {
  title: '${gpuQuota}',
  dataIndex: 'quotaGpu',
  render: text => {
    return text === null ? '∞' : text;
  }
}, {
  title: '${quotaDisk}',
  dataIndex: 'quotaDisk',
  render: text => {
    return text === null ? '∞' : text;
  }
}];

exports.GroupRelation = () => (
  <relation keyName="groups" title="${groups}"
    packageName='../src/cms-components/customize-relation-table'
    relation={{
      to: 'group',
      type: 'toMany'
    }}
    uiParams={{
      columns: groupColumns 
    }}
  >
    <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${name}',
          key: 'name'
        }]}
      />
      <pagination />
    </toolbar>
  </relation>
);