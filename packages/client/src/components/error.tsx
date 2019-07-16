import React, {Component} from 'react';
import {Alert} from 'antd';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: table;
  height: 100%;
  position: absolute;
  width: 100%;
  left: 0;
`

const Inner = styled.div`
  display: table-cell;
  vertical-align: middle;
`

const Content = styled.div`
  max-width: 500px;
  margin: 0 auto;
`

const Spinner = styled.div`
  display: inline-block;
`

export default class LockScreenLoading extends Component {
  render() {
    return (
      <Wrapper>
        <Inner>
          <Content>
            <Alert
              type="error"
              showIcon
              message="We occur errors"
              description="Sorry, we occur some errors while render your web page. Please try refresh, if it still broken contact us at contact@canner.io"/>
          </Content>
        </Inner>
      </Wrapper>
    );
  }
}
