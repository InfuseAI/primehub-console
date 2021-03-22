import React from 'react';
import {Icon, Divider, Tag, Card, Tooltip} from 'antd';
import {isEmpty} from 'lodash';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {DeploymentInfo, Status} from 'ee/components/modelDeployment/common';
import moment from 'moment';
import Field from 'components/share/field';
import mlflowLogo from 'images/mlflow.png';
import matlabLogo from 'images/matlab.svg';
import gitlabLogo from 'images/gitlab.svg';
import defaultLogo from 'images/icon-apps.svg';

type Props = RouteComponentProps & {
  deployment: DeploymentInfo;
  copyClipBoard: (text: string) => void;
};

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  msTextOverflow: 'ellipsis',
  display: 'block',
}

function getCardColor(deployment: DeploymentInfo) {
  switch (deployment.status) {
    case 'Ready':
      return '#87d068';
    case 'Stopping':
    case 'Starting':
      return 'orange'
    case 'Error':
      return 'red';
    case 'Stopped':
    default:
      return '#aaa';
  }
}

class AppCard extends React.Component<Props> {
  render() {
    const {deployment, copyClipBoard, history} = this.props;
    const appType = deployment.name.toLowerCase().indexOf('mlflow') > 0 ? 'MLFlow'
      : deployment.name.toLowerCase().indexOf('gitlab') > 0 ? 'Gitlab'
      : deployment.name.toLowerCase().indexOf('lab') > 0 ? 'MATLAB' : 'myapp';
    const src = appType === 'MLFlow' ? mlflowLogo : appType === 'Gitlab' ? gitlabLogo : appType === 'MATLAB' ? matlabLogo : defaultLogo;
    const appVersion = appType === 'MLFlow' ? 'v1.9.1' : appType === 'Gitlab' ? 'v13.10.0' : appType === 'MATLAB' ? 'R2020b' : 'v1.0.0';
    return (
      <Card
        style={{
          height: '100%',
        }}
        hoverable
        onClick={() => history.push(`model-deployment/${deployment.id}`)}
        actions={[
          <span><Icon type="setting" key="Manage" /> Manage</span>,
          (deployment.status === 'Stopped' ?
            <span><Icon type="caret-right" key="Start" /> Start</span> :
            (deployment.status === 'Ready' ? <span><Icon type="stop" key="Stop" /> Stop</span> : <span><Icon type="reload" key="Restart" /> Restart</span>)
          ),
          <span><Icon type="export" key="Open App" /> Open</span>,
        ]}
      >
        <div style={{clear: 'both'}}>
          <span style={{
            display: 'inline-block',
            height: '64px',
            lineHeight: '52px',
            padding: '5px',
            border: '1px solid #ccc',
            borderRadius: '9px',
            overflow: 'hidden',
            backgroundColor: appType === 'myapp' ? 'rgb(215 222 242)' : null,
            float: 'right'
          }}><img src={src} width='54'/></span>
          <h2 style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            msTextOverflow: 'ellipsis',
            display: 'block'
          }}>
            {deployment.name}
          </h2>
          <div>
            <Tag color={getCardColor(deployment)}>{deployment.status}</Tag>
            <Tag>{appType}:{appVersion}</Tag>
          </div>
        </div>
      </Card>
    );
  }
}

export default withRouter(AppCard);
