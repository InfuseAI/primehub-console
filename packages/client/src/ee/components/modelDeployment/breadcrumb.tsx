import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';

type Props = RouteComponentProps & {
  deploymentName?: string
};

class DeploymentBreadcrumb extends React.Component<Props> {

  render() {
    const { match, deploymentName } = this.props;
    const params = match.params as any

    const basename = params.groupName ? `${appPrefix}g/${params.groupName}` : `${appPrefix}`;

    const breadcrumbItems = [
      <Breadcrumb.Item key="home">
        {
          params.groupName ?
          <Link to={`${basename}`}><Icon type="home" /></Link> :
          <a href={`${basename}`}><Icon type="home" /></a>
        }

      </Breadcrumb.Item>,
      <Breadcrumb.Item key="deployment">
        <Link to={`${basename}/model-deployment?page=1`}>Model Deployments</Link>
      </Breadcrumb.Item>
    ];

    if (match.url.endsWith('/create')) {
      breadcrumbItems.push(<Breadcrumb.Item key="create">
        Create Deployment
      </Breadcrumb.Item>)
    } else if (match.url.endsWith('/edit')) {
      breadcrumbItems.push(<Breadcrumb.Item key="deployment">
        <Link to={`../${params.deploymentId}`}>Deployment: {deploymentName}</Link>
      </Breadcrumb.Item>)
      breadcrumbItems.push(<Breadcrumb.Item key="edit">
        Update Deployment
      </Breadcrumb.Item>)
    } else if (params.deploymentId) {
      breadcrumbItems.push(<Breadcrumb.Item key="detail">
        Deployment: {deploymentName}
      </Breadcrumb.Item>)
    }

    return (
      <Breadcrumb style={{marginBottom: 8}}>
        {breadcrumbItems}
      </Breadcrumb>
    );
  }
}

export default withRouter(DeploymentBreadcrumb);
