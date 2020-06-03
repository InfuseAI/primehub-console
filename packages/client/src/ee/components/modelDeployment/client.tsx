import React from 'react';
import { Form, Input, Col, Table, Icon, Row, Button, Modal, message } from 'antd';
import Column from 'antd/lib/table/Column';
import { ClientItem, ClientResult } from './common';
import { FormComponentProps } from 'antd/lib/form';

const {confirm} = Modal;

type Props = FormComponentProps & {
  clients: Array<ClientItem>
  addClient: (client:string) => void
  removeClient: (client:string) => void
  clientAdded: ClientResult
}

class ModelDeploymentClients extends React.Component<Props> {
  refToken: React.RefObject<any> = React.createRef();

  handleAddClient = (e) => {
    e.preventDefault()
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const {client} = values;
        this.props.addClient(client);
      }
    });
  }

  handleRemoveClient = (name: string) => {
    const {removeClient} = this.props;
    confirm({
      title: `Remove client`,
      content: `Do you want to remove '${name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return removeClient(name);
      },
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

  renderClientList = () => {
    return(
      <Form.Item label="Client List">
      <Table dataSource={this.props.clients} pagination={false}>
        <Column title="Name" dataIndex="name" key="name" />
        <Column
          title=""
          key="action"
          render={(text, record) => (
            <span style={{ float: "right" }}><a><Icon type="delete" onClick={() => {
              const name = (record as any).name as string;
              this.handleRemoveClient(name);
            }} /></a></span>
          )}
        />
      </Table>
      </Form.Item>
    )
  }

  renderAddClient = () => {
    const {clientAdded, form} = this.props;

    return (
      <>
        <Form onSubmit={this.handleAddClient} hideRequiredMark={true}>
          <Form.Item label="Client Name">
            {form.getFieldDecorator('client', {
              rules: [
                { required: true, message: 'Please input your client name!' },
                { pattern: /^[a-z_][a-z0-9_-]*$/, message: `Should match the pattern ^[a-z_][a-z0-9_-]*`}
              ],

            })(
              <Input style={{marginRight: 16, width: 200}} placeholder="client names"/>
            )}
            <Button htmlType="submit">Add client</Button>
          </Form.Item>
        </Form>

        {
          clientAdded
          ? <>
            <Form.Item label="Client Token">
              <Input addonAfter={<a onClick={this.copyToken}>Copy</a>} value={clientAdded.plainTextToken} ref={this.refToken}/>
            </Form.Item>
            {`Your token for client '${clientAdded.name}' is above! Please save this token, as it won't be accessible if you leave this page or add another client.`}
            </>
          : <></>
        }
      </>
    )
  }

  render() {
    const {clients} = this.props;

    return (
      <div style={{ padding: '16px 36px' }}>
        <Row gutter={32}>
          <Col span={12}>
            {this.renderAddClient()}
          </Col>
          <Col span={12}>
            {this.renderClientList()}
          </Col>
        </Row>
      </div>
    );
  }
}


export default Form.create<Props>()(ModelDeploymentClients);