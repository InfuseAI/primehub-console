import * as  React from "react";
import { Layout, Card, Button, Row, Input, message, Modal, notification } from 'antd';
import gql from 'graphql-tag';
import { ApolloConsumer } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { errorHandler } from "utils/errorHandler";

type Props = {
  client: ApolloClient<any>;
}

type State = {
}

const GET_API_TOKEN_COUNT = gql`
  query getApiTokenCount {
    me {
      apiTokenCount
    }
  }
`;

const REVOKE_API_TOKEN = gql`
  mutation revokeApiToken {
    revokeApiToken {
      id
    }
  }
`;

class ApiTokenPage extends React.Component<Props, State> {
  state = {
    modal: false
  }

  apiToken: any;
  graphqlEndpoint: string;
  requestApiTokenEndpoint: string;

  refExample: React.RefObject<any> = React.createRef();
  refToken: React.RefObject<any> = React.createRef();

  constructor(props) {
    super(props)

    this.graphqlEndpoint = (window as any).absGraphqlEndpoint;
    this.apiToken = (window as any).apiToken;
    this.requestApiTokenEndpoint = (window as any).requestApiTokenEndpoint;
  }

  handleRequestApiToken = () => {
    const {client} = this.props;
    client.query<any>({query: GET_API_TOKEN_COUNT, fetchPolicy: 'network-only'})
    .then((result) => {
      if (result.data.me.apiTokenCount == 0) {
        // request token right away
        this.requestToken();
      } else {
        // show dialog if there is existing token
        Modal.confirm({
          title: 'Are you sure you want to request an API token?',
          content: 'Submitting a new request will revoke your existing token.',
          onOk: () => {
            this.requestToken();
          },
          onCancel() {},
        });
      }
    })
    .catch(errorHandler);
  }

  requestToken = () => {
    const {client} = this.props;
    client.mutate({mutation: REVOKE_API_TOKEN})
    .then(() => {
      (window as any).location.href = this.requestApiTokenEndpoint;
    })
    .catch(errorHandler);
  }

  copyToken = () => {
    if (this.refToken && this.refToken.current) {
      const input = this.refToken.current.input;
      input.select();
      document.execCommand('copy');
      input.setSelectionRange(0, 0);
      input.blur();
      message.success('copied');
    }
  }

  copyExample = () => {
    if (this.refExample && this.refExample.current) {
      this.refExample.current.textAreaRef.select();
      document.execCommand('copy');
      message.success('copied');
      this.refExample.current.textAreaRef.blur();
    }
  }

  render = () => {
    const example = `API_TOKEN="${this.apiToken ? this.apiToken : '<API TOKEN>'}"

curl -X POST \\
    -H 'Content-Type: application/json' \\
    -H "authorization: Bearer \${API_TOKEN}" \\
    -d '{"query":"{me{id,username}}"}' \\
    ${this.graphqlEndpoint}`

    const Token = (this.apiToken ? <>

      <Input
        readOnly
        style={{ marginBottom: 16 }}
        defaultValue={this.apiToken}
        addonAfter={<a onClick={() => this.copyToken()} style={{ color: "black" }}>Copy</a>}
        ref={this.refToken}
      />


      <Row style={{ marginBottom: 16 }}>Please save this token. You won't be able to access it again.</Row>
    </> : <></>);

    return (
      <Layout style={{ margin: "16px 64px" }}>
        <Card title="Token">
          {Token}

          <Button type="primary" onClick={this.handleRequestApiToken} >Request API Token</Button>
        </Card>
        <Card title="Example" style={{ margin: "16px 0" }}>
          <Button icon="copy" onClick={() => this.copyExample()}
            style={{
              float: 'right',
              top: 32,
              marginTop: -32,
              zIndex: 10,
              position: 'relative',
              color: '#ccc',
              borderColor: '#ccc'
            }}
            type="ghost"
          >
          </Button>
          <Input.TextArea
            style={{
              whiteSpace: 'nowrap',
              background: 'black',
              color: '#ddd',
              fontFamily: 'monospace',
            }}
            ref={this.refExample}
            rows={8}
            value={example}
          />
        </Card>
      </Layout>
    )
  }
}

export default () => (
  <ApolloConsumer>
    {client => <ApiTokenPage client={client} />}
  </ApolloConsumer>
)
