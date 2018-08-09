/** @jsx builder */
import builder, {Default, Tabs, Layout, configure, Block} from 'canner-script';
import RelationTable from '../src/cms-components/customize-relation-table';
import {storage} from './utils';
import HideInCreate from '../src/cms-layouts/hideInCreate';
import Tab from '../src/cms-layouts/tab';
import CustomizeBlock from '../src/cms-layouts/block';
import ResetPassword from '../src/cms-components/customize-object-password_form';
import SendEmail from '../src/cms-components/customize-object-email_form';
import Layouts from 'canner-layouts';

configure({
  visitorManager: {
    visitors: [{
      'plugins.array': path => {
        if (path.node.keyName === 'user') {
          const {children} = path.node;
          const layouts = [{
            nodeType: 'layout',
            name: '__1',
            keyName: '__1',
            childrenName: [],
            title: 'Send Email',
            component: Layouts.default,
            children: [{
              type: 'object',
              nodeType: 'plugins.object',
              keyName: '__1',
              path: 'user/__1',
              pattern: 'array.object',
              controlDeployAndResetButtons: true,
              loader: import('../src/cms-components/customize-object-email_form')
            }],
            hocs: ['containerRouter'],
            __CANNER_KEY__: children[0].__CANNER_KEY__.slice(-1)
          }, {
            nodeType: 'layout',
            name: '__2',
            keyName: '__2',
            childrenName: [],
            component: Layouts.default,
            title: 'Reset Password',
            children: [{
              type: 'object',
              nodeType: 'plugins.object',
              keyName: '__2',
              path: 'user/__2',
              pattern: 'array.object',
              controlDeployAndResetButtons: true,
              loader: import('../src/cms-components/customize-object-password_form')
            }],
            hocs: ['containerRouter'],
            __CANNER_KEY__: children[0].__CANNER_KEY__.slice(-1)
          }];
          path.tree.setChildren(path.route, [...children, ...layouts]);
        }
      }
    }]
  }
})

export default () => (
  <array keyName="user" title="User"
    controlDeployAndResetButtons={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: 'Username',
        dataIndex: 'username'
      }, {
        title: 'Email',
        dataIndex: 'email'
      }, {
        title: 'Name',
        dataIndex: 'firstName',
        render: (text, record) => `${text} ${record.lastName}`
      }, {
        title: 'Enabled',
        dataIndex: 'enabled'
      }, {
        title: 'Admin',
        dataIndex: 'isAdmin'
      }, {
        title: 'Totp',
        dataIndex: 'totp'
      }],
    }}
    storage={storage}
  >
    <Layout component={Tab} disabledKeysInCreate={['__1', '__2']}>
    {/* <Layout component={CustomizeBlock} disabledKeysInCreate={['__1', '__2']}> */}
    {/* <image keyName="thumbnail" title="Thumbnail" disabled /> */}
    <Default title="Basic Info">
      <string keyName="username" title="Username"
        validation={{pattern: '^[a-z0-9_]+$'}}
        required
      />
      <string keyName="email" title="Email" required validation={{format: 'email'}}/>
      <Layout component={HideInCreate}>
        <string keyName="firstName" title="FirstName" />
        <string keyName="lastName" title="LastName" />
        <boolean keyName="totp" title="Totp" />
        <boolean keyName="isAdmin" title="IsAdmin" />
        <boolean keyName="enabled" title="Enabled" />
        {/* <number keyName="createdTimestamp" title="CreatedTimestamp" /> */}
        <number keyName="personalDiskQuota" title="PersonalDiskQuota" uiParams={{unit: ' GB', step: 1, min: 0, precision: 1}}
          packageName="../src/cms-components/customize-number-precision"
        />
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
    {/* <Layout component={HideInCreate} keyName="__1" title="Send Email">
      <object keyName="__1" packageName="../src/cms-components/customize-object-email_form"/>
    </Layout>
    <Layout component={HideInCreate} keyName="__2"  title="Reset Password">
      <object keyName="__2" packageName="../src/cms-components/customize-object-password_form"/>
    </Layout> */}

    </Layout>
  </array>
)
