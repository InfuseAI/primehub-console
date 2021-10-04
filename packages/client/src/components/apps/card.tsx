import React from 'react';
import { Icon, Tag, Card, Tooltip } from 'antd';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import PhApplication from 'interfaces/phApplication';
import AppLogo from 'components/apps/appLogo';

type Props = RouteComponentProps & {
  startApp: (appId: string, appName: string) => void;
  stopApp: (appId: string, appName: string) => void;
  application: PhApplication;
  copyClipBoard: (text: string) => void;
};

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  msTextOverflow: 'ellipsis',
  display: 'block',
};

function getCardColor(application: PhApplication) {
  switch (application.status) {
    case 'Ready':
      return 'green';
    case 'Stopping':
    case 'Starting':
    case 'Updating':
      return 'orange';
    case 'Error':
      return 'red';
    case 'Stopped':
    default:
      return '#aaa';
  }
}

class AppCard extends React.Component<Props> {
  bindStartApp(id: string, name: string) {
    const { startApp } = this.props;
    return () => {
      startApp(id, name);
    };
  }

  bindStopApp(id: string, name: string) {
    const { stopApp } = this.props;
    return () => {
      stopApp(id, name);
    };
  }

  render() {
    const { application } = this.props;
    const { appName, appIcon, appVersion, appUrl } = application;
    return (
      <Card
        style={{
          height: '100%',
        }}
        actions={[
          <Link key='manage' to={`apps/${application.id}`}>
            <Icon type='setting' key='Manage' /> Manage
          </Link>,
          application.status === 'Stopped' ? (
            <span
              onClick={this.bindStartApp(
                application.id,
                application.displayName
              )}
            >
              <Icon type='caret-right' key='Start' /> Start
            </span>
          ) : application.status === 'Ready' ? (
            <span
              onClick={this.bindStopApp(
                application.id,
                application.displayName
              )}
            >
              <Icon type='stop' key='Stop' /> Stop
            </span>
          ) : (
            <span>
              <Icon type='loading' key='Loading' />
            </span>
          ),
          <a key='open-app' href={`${appUrl}`} target='_blank' rel='noreferrer'>
            <Icon type='export' key='Open App' /> Open
          </a>,
        ]}
      >
        <div style={{ clear: 'both' }}>
          <AppLogo style={{ float: 'right' }} src={appIcon} />
          <div
            style={{ display: 'flex', alignItems: 'center', maxWidth: '100%' }}
          >
            <Tooltip placement='top' title={application.displayName}>
              <h2 style={textOverflowStyle}>{application.displayName}</h2>
            </Tooltip>
          </div>
          <div>
            <Tag color={getCardColor(application)} style={{ cursor: 'auto' }}>
              {application.status}
            </Tag>
            <Tag style={{ cursor: 'auto' }}>
              {appName}:{appVersion}
            </Tag>
          </div>
        </div>
      </Card>
    );
  }
}

export default withRouter(AppCard);
