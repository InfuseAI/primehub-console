import React from 'react';
import {Icon, Divider, Tag, Card, Tooltip} from 'antd';
import {isEmpty} from 'lodash';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {ApplicationInfo} from 'containers/appList';
import moment from 'moment';
import Field from 'components/share/field';
import defaultLogo from 'images/icon-apps.svg';

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
        }}
        hoverable
        onClick={() => history.push(`apps/${application.id}`)}
        actions={[
          <a href={`apps/${application.id}`}><Icon type='setting' key='Manage' /> Manage</a>,
          (application.status === 'Stopped' ?
            <span><Icon type='caret-right' key='Start' /> Start</span> :
            (application.status === 'Ready' ? <span><Icon type='stop' key='Stop' /> Stop</span> : <span><Icon type='reload' key='Restart' /> Restart</span>)
          ),
          <a href={`${appUrl}`} target='_blank'><Icon type='export' key='Open App' /> Open</a>,
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
            backgroundColor: src === defaultLogo ? 'rgb(215 222 242)' : null,
            float: 'right'
          }}><img src={src} width='54'/></span>
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
