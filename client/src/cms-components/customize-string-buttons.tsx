import * as React from 'react';
import {Button, Row, Col} from 'antd';
import styled from 'styled-components';
import {Props} from './types';

const Wrapper = styled.div`
  text-align: right;
  button {
    margin-left: 16px;
  }
`

export default class Buttons extends React.Component<Props> {
  key: string;

  constructor(props) {
    super(props);
    this.key = props.refId.getPathArr()[0];
  }

  saveAsDraft = () => {
    const {onChange, refId} = this.props;
    onChange(refId, 'update', 'draft')
      .then(() => {
        this.deploy();
      });
  }

  send = () => {
    const {onChange, refId} = this.props;
    onChange(refId, 'update', 'published')
      .then(() => {
        this.deploy();
      });
  }

  deploy = () => {
    const {deploy, refId, routes, goTo} = this.props;
    deploy(this.key).then(() => {
      goTo({
        pathname: `/${routes[0]}`
      });
    });
  }

  reset = () => {
    const {reset, goTo, refId, routes} = this.props;
    reset(this.key).then(() => {
      goTo({
        pathname: `/${routes[0]}`
      });
    })
  }

  render() {
    return (
      <Wrapper>
        <Button type="primary" onClick={this.send}>
          Send Announcement
        </Button>
        <Button onClick={this.saveAsDraft}>
          Save as draft
        </Button>
        <Button onClick={this.reset}>
          Cancel
        </Button>
      </Wrapper>
    )
  }
}