import * as React from 'react';
import {Modal, Input, Icon, Tooltip, Row} from 'antd';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 16px;
`;

const Label = styled.span`
  margin-right: 16px;
  width: 100px;
`

export default ({
  secret,
  onOk,
  title
}) => {
  Modal.success({
    title,
    content: (
      <div>
        <Wrapper>
          <Label>Username: </Label>
          <CopyToClipboard value={secret.username} />
        </Wrapper>
        <Wrapper>
          <Label>Password: </Label>
          <CopyToClipboard value={secret.password} />
        </Wrapper>
      </div>
    ),
    onOk
  });
}


export class CopyToClipboard extends React.Component<{value: string}> {
  private textArea: React.Ref<any> = React.createRef();
  private state = {
    tip: 'Copy'
  }

  copyClipBoard = () => {
    if (this.textArea && (this.textArea as any).current) {
      this.setState({
        tip: 'Copied'
      });
      (this.textArea as any).current.select();
      document.execCommand('copy');
    }
  }

  onMouseLeave = () => {
    setTimeout(() => {
      this.setState({
        tip: 'Copy'
      });
    }, 400);
  }

  render() {
    const {value} = this.props;
    const {tip} = this.state;
    return (
      <Input value={value} ref={this.textArea} suffix={
        document.queryCommandSupported('copy') && (
          <Tooltip title={tip}>
            <Icon type="copy" onClick={this.copyClipBoard} onMouseLeave={this.onMouseLeave} style={{
              cursor: 'pointer'
            }} />
          </Tooltip>
        )}
      />
    )
  }
}