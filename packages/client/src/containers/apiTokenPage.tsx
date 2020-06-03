import * as  React from "react";
import { Layout, Card, Button, Row, Input, message, Modal } from 'antd';

type Props = {
}

type State = {
}

export default class ApiTokenPage extends React.Component<Props, State> {
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
    Modal.confirm({
      title: 'Are you sure you want to request an API token?',
      content: 'Submitting a new request will revoke your existing token.',
      onOk: () => {
        (window as any).location.href = this.requestApiTokenEndpoint;
      },
      onCancel() {},
    });     
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