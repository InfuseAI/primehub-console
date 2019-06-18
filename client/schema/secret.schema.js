/** @jsx CannerScript */
import CannerScript, {Condition, Default} from 'canner-script';

export default () => (
  <array ui="tableRoute"
    keyName="secret"
    title="Secrets"
    uiParams={{
      columns: [{
        title: 'Name',
        dataIndex: 'name'
      }, {
        title: 'Display Name',
        dataIndex: 'displayName'
      }]
    }}
    graphql={`
      query($secretWhere: SecretWhereInput) {
      secret: secretsConnection(where: $secretWhere) {
        edges {
          cursor
          node {
            id
            name
            displayName
            secret
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
    `}
    fetchPolicy="network-only"
  >
    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
      <string keyName="name" title="${name}"
        validation={{
          validator: (value, cb) => {
            if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/)) {
              return cb(`lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`);
            }
          }
        }}
        required
      />
    </Condition>
    <string keyName="displayName" title="${displayName}" />
    <Condition match={(data, operator) => operator === 'create'} defaultMode="disabled">
      <enum
        keyName="type"
        title="${secret.type}"
        defaultValue="opaque"
        values={['opaque', 'kubernetes']}
        uiParams={{
          options: [{
            text: 'Opaque',
            value: 'opaque'
          }, {
            text: 'kubernetes.io/dockerconfigjson',
            value: 'kubernetes'
          }],
          style: {width: '400px'}
        }}
        style={{width: '400px'}}
      />
    </Condition>
    <Condition match={data => data.type === 'opaque'}>
      <string keyName="secret" title="${secret}" ui="textarea" />
    </Condition>
    <Condition defaultMode="hidden" match={data => data.type === 'kubernetes'} >
      <TypeKubernetesAppendFields />
    </Condition>
    
  </array>
)


function TypeKubernetesAppendFields({}) {
  return (
    <Default>
    <string keyName="registryHost" required
      title="${secret.registryHost}"
      validation={{
        validator: (value, reject) => {
          // write some validations if u want
        }
      }}
    />
    <string keyName="username" required
      title="${secret.username}"
      validation={{
        validator: (value, reject) => {
          {/* if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/)) {
            return reject(`lower case alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`);
          } */}
        }
      }}
    />
    <string keyName="password" required
      title="${secret.password}"
      uiParams={{type: 'password'}}
      validation={{
        validator: (value, reject) => {
          // write some validations if u want
        }
      }}
    />
    </Default>
  )
}
