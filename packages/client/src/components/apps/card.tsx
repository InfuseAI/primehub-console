import React from 'react';
import {Icon, Tag, Card, Tooltip} from 'antd';
import {Link} from 'react-router-dom';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {ApplicationInfo} from 'containers/appList';
import defaultLogo from 'images/icon-apps.svg';
import styled from 'styled-components';

export const AppLogo = styled.span`
  display: inline-block;
  height: 64px;
  line-height: 52px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 9px;
  overflow: hidden;
  img {
    width: 54px !important;
  }
`;

type Props = RouteComponentProps & {
  application: ApplicationInfo;
  copyClipBoard: (text: string) => void;
};

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  msTextOverflow: 'ellipsis',
  display: 'block',
};

function getCardColor(application: ApplicationInfo) {
  switch (application.status) {
    case 'Ready':
      return '#87d068';
    case 'Stopping':
    case 'Starting':
      return 'orange';
    case 'Error':
      return 'red';
    case 'Stopped':
    default:
      return '#aaa';
  }
}

class AppCard extends React.Component<Props> {
  render() {
    const {application, history} = this.props;
    const {appName, appIcon, appVersion, appUrl} = application;
    const src = appIcon && appIcon.length > 0 ? appIcon : defaultLogo;
    return (
      <Card
        style={{
          height: '100%',
          backgroundColor: src === defaultLogo ? 'rgb(215 222 242)' : null,
        }}
        actions={[
          <Link to={`apps/${application.id}`}><Icon type='setting' key='Manage' /> Manage</Link>,
          (application.status === 'Stopped' ?
            <span><Icon type='caret-right' key='Start' /> Start</span> :
            (application.status === 'Ready' ? <span><Icon type='stop' key='Stop' /> Stop</span> : <span><Icon type='reload' key='Restart' /> Restart</span>)
          ),
          <a href={`${appUrl}`} target='_blank'><Icon type='export' key='Open App' /> Open</a>,
        ]}
      >
        <div style={{clear: 'both'}}>
          <AppLogo style={{
            float: 'right',
            backgroundColor: src === defaultLogo ? 'rgb(215 222 242)' : null,
          }}>
            <img src={src} />
          </AppLogo>
          <h2 style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            msTextOverflow: 'ellipsis',
            display: 'block'
          }}>
            {application.displayName}
          </h2>
          <div>
            <Tag color={getCardColor(application)}>{application.status}</Tag>
            <Tag>{appName}:{appVersion}</Tag>
          </div>
        </div>
      </Card>
    );
  }
}

export default withRouter(AppCard);
