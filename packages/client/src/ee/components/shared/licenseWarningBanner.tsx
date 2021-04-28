import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {Alert} from 'antd';
import {errorHandler} from 'utils/errorHandler';
import {get} from 'lodash';
import styled from 'styled-components'

type Props = {
  data?: any;
}

type State = {
}

export const GET_LICENSE = gql`
  query {
    license {
      startedAt
      expiredAt
      maxGroup
      maxNode
      maxModelDeploy
      licensedTo
      licenseStatus
      usage {
        maxGroup
        maxNode
        maxModelDeploy
      }
    }
  }
`;

class LicenseWarningBanner extends React.Component<Props, State> {

  expired = (
    <Alert
      message='Your license has expired. Please contact your sales team to extend your license.'
      description=' '
      type='warning'
      showIcon />
  );

  reachedNodeLimit = (
    <Alert
      message='Your are using more nodes than your license allows. Please contact your system administrator.'
      description=' '
      type='warning'
      showIcon />
  );

  reachedModelDeployLimit = (
    <Alert
      message='Please contact your system administrator for assistance to upgrade your license to run more deployments.'
      description=' '
      type='warning'
      showIcon />
  );

  render() {
    const {data} = this.props;
    const alerts = [];

    if (data && data.license && data.license.usage) {
      const license = data.license;
      const usage = data.license.usage;

      if (license.licenseStatus === 'expired') {
        alerts.push(this.expired);
      }
      if (license.maxNode !== -1 && usage.maxNode > license.maxNode) {
        alerts.push(this.reachedNodeLimit);
      }
      if (license.maxModelDeploy !== -1 && usage.maxModelDeploy > data.license.maxModelDeploy) {
        alerts.push(this.reachedModelDeployLimit);
      }
    }

    return (
      <>
        { ...alerts }
      </>
    );
  }
}

export default graphql(GET_LICENSE, {
  options: (props: Props) => ({
    fetchPolicy: 'cache-and-network',
    })
  })
(LicenseWarningBanner);
