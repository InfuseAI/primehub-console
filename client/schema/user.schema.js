/** @jsx builder */
import builder, {Default, Tabs, Layout, configure, Block, Condition} from 'canner-script';
import RelationTable from '../src/cms-components/customize-relation-table';
import {SendEmailTitle, ResetPasswordTitle} from './utils';
import Tab from '../src/cms-layouts/tab';
import CustomizeBlock from '../src/cms-layouts/block';
import ResetPassword from '../src/cms-components/customize-object-password_form';
import SendEmail from '../src/cms-components/customize-object-email_form';
import Layouts from 'canner-layouts';
import Filter from '../src/cms-toolbar/filter';

configure({
  visitorManager: {
    visitors: [{
      'component.array': path => {
        if (path.node.keyName === 'user') {
          const {children} = path.node;
          const layouts = [{
            nodeType: 'layout',
            name: '__1',
            keyName: '__1',
            childrenName: [],
            title: SendEmailTitle,
            component: Layouts.default,
            children: [{
              type: 'object',
              nodeType: 'component.object',
              keyName: '__1',
              path: 'user/__1',
              pattern: 'array.object',
              controlDeployAndResetButtons: true,
              cacheActions: true,
              loader: new Promise(resolve => require.ensure([], function(require) {
                resolve(require('../src/cms-components/customize-object-email_form'));
              }))
            }],
            hocs: ['containerRouter'],
            __CANNER_KEY__: children[0].__CANNER_KEY__.slice(-1)
          }, {
            nodeType: 'layout',
            name: '__2',
            keyName: '__2',
            childrenName: [],
            component: Layouts.default,
            title: ResetPasswordTitle,
            children: [{
              type: 'object',
              nodeType: 'component.object',
              keyName: '__2',
              path: 'user/__2',
              pattern: 'array.object',
              controlDeployAndResetButtons: true,
              cacheActions: true,
              loader: new Promise(resolve => require.ensure([], function(require) {
                resolve(require('../src/cms-components/customize-object-password_form'));
              }))
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
  <array keyName="user" title="${users}"
    controlDeployAndResetButtons={true}
    cacheActions={true}
    hideButtons={true}
    packageName="../src/cms-components/customize-array-table_route"
    uiParams={{
      columns: [{
        title: '${username}',
        dataIndex: 'username'
      }, {
        title: '${email}',
        dataIndex: 'email'
      }, {
        title: '${completeName}',
        dataIndex: 'firstName',
        render: (text, record) => `${text} ${record.lastName}`
      }, {
        title: '${enabled}',
        dataIndex: 'enabled'
      }, {
        title: '${isAdmin}',
        dataIndex: 'isAdmin'
      }, {
        title: '${totp}',
        dataIndex: 'totp'
      }],
    }}
  >
    <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${username}',
          key: 'username'
        }, {
          type: 'text',
          label: '${email}',
          key: 'email'
        }]}
      />
      <pagination />
    </toolbar>
    <Layout component={Tab} disabledKeysInCreate={['__1', '__2']}>
    {/* <Layout component={CustomizeBlock} disabledKeysInCreate={['__1', '__2']}> */}
    {/* <image keyName="thumbnail" title="Thumbnail" disabled /> */}
    <Default title="${basicInfo}" keyName="basicInfo">
      <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
        <string keyName="username" title="${username}"
          validation={{
            validator: (value, cb) => {
              if (!value.match(/^[a-z][-a-z0-9_.@]*$/)) {
                return cb(`only lower case alphanumeric characters, '-', '_", or '.', and underscores ("_") are allowed, and must start with a letter.`);
              }
            }
          }}
          required
        />
      </Condition>
      <string keyName="email" title="${email}" validation={{
          validator: (value, cb) => {
            if (value && !value.match(/(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
              return cb('should match format "email"');
            }
          }
        }}
      />
      <Condition match={(data, operator) => operator === 'update'}>
        <string keyName="firstName" title="${firstName}" />
        <string keyName="lastName" title="${lastName}" />
        <boolean keyName="totp" title="${totp}" />
        <boolean keyName="isAdmin" title="${isAdmin}" />
        <boolean keyName="enabled" title="${enabled}" />
        {/* <number keyName="createdTimestamp" title="CreatedTimestamp" /> */}
        <number keyName="personalDiskQuota" title="${personalDiskQuota}"
          uiParams={{unit: ' GB', step: 1, min: 1, precision: 0}}
          defaultValue={1}
          validation={{min: 1}}
          packageName="../src/cms-components/customize-number-precision"
        />
        <relation keyName="groups" title="${groups}"
          packageName='../src/cms-components/customize-relation-table'
          relation={{
            to: 'group',
            type: 'toMany'
          }}
          uiParams={{
            columns: [{
              title: '${name}',
              dataIndex: 'name'
            }, {
              title: '${displayName}',
              dataIndex: 'displayName'
            }, {
              title: '${canUseGPU}',
              dataIndex: 'canUseGpu'
            }, {
              title: '${gpuQuota}',
              dataIndex: 'gpuQuota'
            }, {
              title: '${diskQuota}',
              dataIndex: 'diskQuota'
            }]
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
      </Condition>
    </Default>
    </Layout>
  </array>
)
