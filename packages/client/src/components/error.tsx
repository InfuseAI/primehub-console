import React from 'react';
import { Alert } from 'antd';
import styled from 'styled-components';

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  left: 0;
`;

const Inner = styled.div`
  vertical-align: middle;
`;

const Content = styled.div`
  max-width: 500px;
  margin: 35vh auto;
`;

const ErrorAlert = () => {
  return (
    <Wrapper>
      <Inner>
        <Content>
          <Alert
            type='error'
            showIcon
            message='We occur errors'
            description={
              <>
                Sorry, we occur some errors while render your web page. Please
                try refresh, if it still broken contact us at{' '}
                <a href='mailto:support@infuseai.io'>support@infuseai.io</a>
              </>
            }
          />
        </Content>
      </Inner>
    </Wrapper>
  );
};

export default ErrorAlert;
