import React from 'react';
import {Row, Col, Card, Tooltip} from 'antd';
import {isEmpty} from 'lodash';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {DeploymentInfo, Status} from 'components/modelDeployment/common';
import moment from 'moment';
import { appPrefix } from 'utils/env';

type Props = RouteComponentProps & {
  deployment: DeploymentInfo;
  copyClipBoard: (text: string) => void;
}

export function Field({
  label,
  value,
  type = 'horizontal',
  style = {}
}: {
  label: React.ReactNode,
  value: React.ReactNode,
  style?: object,
  type?: 'vertical' | 'horizontal'
}) {
  if (type === 'vertical') return (
    <div style={{marginBottom: 8, ...style}}>
      <div style={{
        color: '#aaa',
        marginBottom: 8
      }}>
        {label}
      </div>
      <div style={{color: '#333'}}>
        {value}
      </div>
    </div>
  )
  return (
    <Row gutter={12} style={{marginBottom: 8, ...style}}>
      <Col span={8} style={{
        color: '#aaa',
      }}>
        {label}
      </Col>
      <Col span={16} style={{wordBreak: 'break-all'}}>
        {value}
      </Col>
    </Row>
  )
}

function getCardColor(deployment: DeploymentInfo) {
  switch (deployment.status) {
    case Status.Deployed:
      return '#33ea33';
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
        onClick={() => history.push(`${appPrefix}model-deployment/${deployment.id}`)}
      >
        <Tooltip
          overlayStyle={{width: '100%'}}
          title={deployment.name}
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
        </Tooltip>
        <Field
          label="Group"
          value={deployment.groupName || 'fdjskalfdjskafjdlsafjdksafl;djkslagdjksfadjsalkf;adsfkdjlsa'}
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
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  msTextOverflow: 'ellipsis',
                  display: 'block'
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
              overlayStyle={{width: '100%'}}
              title={(
                <>
                  {Object.keys(deployment.metadata).map(key => (
                    <Field
                      style={{marginBottom: 0}}
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