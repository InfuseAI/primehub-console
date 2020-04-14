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

const textOverflowStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  msTextOverflow: 'ellipsis',
  display: 'block',
}

export function Field({
  label,
  value,
  type = 'flex',
  style = {},
  labelStyle = {},
  valueStyle = {}
}: {
  label: React.ReactNode,
  value: React.ReactNode,
  style?: React.CSSProperties,
  labelStyle?: React.CSSProperties,
  valueStyle?: React.CSSProperties,
  type?: 'vertical' | 'horizontal' | 'flex'
}) {
  if (type === 'vertical') return (
    <div style={{marginBottom: 8, ...style}}>
      <div style={{
        color: '#aaa',
        marginBottom: 8,
        ...labelStyle
      }}>
        {label}
      </div>
      <div style={{color: '#333', ...valueStyle}}>
        {value}
      </div>
    </div>
  )
  if (type === 'flex') return (
    <Row gutter={12} style={{marginBottom: 8, ...style}}>
      <Col span={8} style={{
        color: '#aaa',
        ...labelStyle
      }}>
        {label}
      </Col>
      <Col span={16} style={{wordBreak: 'break-all', ...valueStyle}}>
        {value}
      </Col>
    </Row>
  )

  if (type === 'horizontal') return (
    <div style={{marginBottom: 8,  display: 'flex', ...style}}>
      <span style={{
        color: '#aaa',
        width: 80,
        minWidth: 80,
        marginRight: 16,
        ...labelStyle
      }}>
        {label}
      </span>
      <span style={{wordBreak: 'break-all', width: '100%', ...valueStyle}}>
        {value}
      </span>
    </div>
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