/** @jsx builder */
import builder, {Default, Tabs, Layout} from 'canner-script';
import RelationTable from '../src/cms-components/customize-relation-table';
import {storage} from './utils';
import HideInCreate from '../src/cms-layouts/hideInCreate';
import Tab from '../src/cms-layouts/tab';

export default () => (
  <array keyName="user" title="User" ui="tableRoute"
    uiParams={{
      columns: [{
        title: 'username',
        dataIndex: 'username'
      }],
    }}
    storage={storage}
  >
    
    <Layout component={Tab} disabledKeysInCreate={['__1', '__2']}>
    {/* <image keyName="thumbnail" title="Thumbnail" disabled /> */}
    <Default title="Basic Info">
      <string keyName="username" title="Username"
        validation={{pattern: '^[a-z0-9_]+$'}}
        required
      />
      <string keyName="email" title="Email" validation={{format: 'email'}}/>
      <Layout component={HideInCreate}>
        <string keyName="firstName" title="FirstName" />
        <string keyName="lastName" title="LastName" />
        <boolean keyName="totp" title="Totp" />
        <boolean keyName="isAdmin" title="IsAdmin" />
        <boolean keyName="enabled" title="Enabled" />
        {/* <number keyName="createdTimestamp" title="CreatedTimestamp" /> */}
        <string keyName="personalDiskQuota" title="PersonalDiskQuota" />
        <relation keyName="groups" title="Groups"
          packageName='../src/cms-components/customize-relation-table'
          relation={{
            to: 'group',
            type: 'toMany'
          }}
          uiParams={{
            textCol: 'displayName',
            columns: [{
              title: 'Display Name',
              dataIndex: 'displayName'
            }, {
              title: 'Can Use GPU',
              dataIndex: 'canUseGpu'
            }, {
              title: 'GPU Quota',
              dataIndex: 'gpuQuota'
            }, {
              title: 'Disk Quota',
              dataIndex: 'diskQuota'
            }]
          }}
        >
          <toolbar>
            {/* <filter
              fields={[{
                type: 'text',
                label: 'Display Name',
                key: 'displayName'
              }]}
            /> */}
            <pagination />
          </toolbar>
        </relation>
      </Layout>
    </Default>
    <Layout component={HideInCreate} keyName="__1" title="Send Email">
      <object keyName="__1"  packageName="../src/cms-components/customize-object-email_form"/>
    </Layout>
    <Layout component={HideInCreate} keyName="__2"  title="Reset Password">
      <object keyName="__2"  packageName="../src/cms-components/customize-object-password_form"/>
    </Layout>

    </Layout>
  </array>
)