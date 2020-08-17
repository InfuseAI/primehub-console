import React from 'react';
import {Card, Tooltip} from 'antd';
import {isEmpty} from 'lodash';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {DeploymentInfo, Status} from 'ee/components/modelDeployment/common';
import moment from 'moment';
import Field from 'components/share/field';

type Props = RouteComponentProps & {
  deployment: DeploymentInfo;
  copyClipBoard: (text: string) => void;
}

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  msTextOverflow: 'ellipsis',
  display: 'block',
}

function getCardColor(deployment: DeploymentInfo) {
  switch (deployment.status) {
    case Status.Deployed:
      return '#33ea33';
    case Status.Stopping:
    case Status.Deploying:
      return 'orange'
    case Status.Failed:
      return 'red';
    case Status.Stopped:
    default:
      return '#aaa';
  }
}

class DeploymentCard extends React.Component<Props> {
  render() {
    const {deployment, copyClipBoard, history} = this.props;
    return (
      <Card
        style={{
          height: '100%',
          borderLeft: `8px solid ${getCardColor(deployment)}`
        }}
        hoverable
        onClick={() => history.push(`model-deployment/${deployment.id}`)}
      >
        <h2 style={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          msTextOverflow: 'ellipsis',
          display: 'block'
        }}>
          {deployment.name}
        </h2>
        <Field
          label="Group"
          value={(
            <div style={textOverflowStyle}>
              {deployment.groupName || '-'}
            </div>
          )}
        />
        <Field
          label="Endpoint"
          value={deployment.status === Status.Deployed ? (
            <Tooltip title={(
              <span>
                Click to copy:
                {` `}
                <strong>{deployment.endpoint || ''}</strong>
              </span>
            )}>
              <a
                style={{
                  textDecoration: 'underline',
                  ...textOverflowStyle
                }}
                onClick={e => {
                  e.stopPropagation();
                  copyClipBoard(deployment.endpoint || '')
                }}
              >
                {deployment.endpoint}
              </a>
            </Tooltip>
          ) : '-'}
        />
        <Field
          label="Metadata"
          value={!isEmpty(deployment.metadata) ? (
            <Tooltip
              overlayStyle={{maxWidth: 300}}
              title={(
                <>
                  {Object.keys(deployment.metadata).map(key => (
                    <Field
                      type="horizontal"
                      style={{marginBottom: 0}}
                      labelStyle={{...textOverflowStyle}}
                      valueStyle={{...textOverflowStyle}}
                      key={key}
                      label={key}
                      value={deployment.metadata[key]}
                    />
                  ))}
                </>
              )}
            >
              <a>
                View
              </a>
            </Tooltip>
          ): '-'}
        />
        <Field
          label="Last Updated"
          value={deployment.lastUpdatedTime ? moment(deployment.lastUpdatedTime).fromNow() : '-'}
        />
      </Card>
    )
  }
}

export default withRouter(DeploymentCard)
