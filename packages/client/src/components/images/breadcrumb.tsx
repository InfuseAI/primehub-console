import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';

type Props = RouteComponentProps & {
  scheduleName?: string
};

class ImageBreadcrumb extends React.Component<Props> {

  render() {
    const { match, scheduleName } = this.props;
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
      <Breadcrumb.Item key="schedule">
        <Link to={`${basename}/images?page=1`}>Images</Link>
      </Breadcrumb.Item>
    ];

    if (params.scheduleId) {
      breadcrumbItems.push(<Breadcrumb.Item key="detail">
        Schedule: {scheduleName}
      </Breadcrumb.Item>)
    } else if (match.url.endsWith('images/create')) {
      breadcrumbItems.push(<Breadcrumb.Item key="create">
        New Image
      </Breadcrumb.Item>)
    }

    return (
      <Breadcrumb style={{marginBottom: 8}}>
        {breadcrumbItems}
      </Breadcrumb>
    );
  }
}

export default withRouter(ImageBreadcrumb);
