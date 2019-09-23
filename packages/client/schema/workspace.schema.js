/** @jsx builder */
import builder, {Block} from 'canner-script';
import Filter from '../src/cms-toolbar/filter';

export default () => (
  <array
    keyName="workspace"
    title="${workspace}"
    ui="tableRoute"
    uiParams={{
      columns: [{
        title: '${workspace.name.title}',
        dataIndex: 'name'
      }, {
        title: '${workspace.displayName.title}',
        dataIndex: 'displayName'
      }, {
        title: '${workspace.description.title}',
        dataIndex: 'description'
      }]
    }}
    graphql={`
      query($workspaceWhere: WorkspaceWhereInput) {
        workspace: workspacesConnection(where: $workspaceWhere) {
          edges {
            cursor
            node {
              id
              name
              displayName
              description
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `}
  >
    {/* <toolbar async>
      <filter
        component={Filter}
        fields={[{
          type: 'text',
          label: '${name}',
          placeholder: '{name}',
          key: 'name'
        }]}
      />
      <pagination />
    </toolbar> */}
    <Block title="${workspace.block1.title}">
      <string required keyName="name" title="${workspace.name.title}" /> 
      <string required keyName="displayName" title="${workspace.displayName.title}" /> 
      <string ui="textarea" keyName="description" title="${workspace.description.title}" /> 
    </Block>

    <Block title="${workspace.block2.title}">
      <relation
        keyName="members"
        packageName='../src/cms-components/customize-relation-table'
        relation={{
          to: 'user',
          type: 'toMany'
        }}
        uiParams={{
          textCol: 'username',
          columns: [{
            title: '${username}',
            dataIndex: 'username'
          }]
        }}
      >
        <toolbar async>
          <filter
            component={Filter}
            fields={[{
              type: 'text',
              label: '${username}',
              key: 'username'
            }]}
          />
          <pagination />
        </toolbar>
      </relation>
    </Block>
  </array>
)
