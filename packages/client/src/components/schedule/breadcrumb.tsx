import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';

type Props = RouteComponentProps & {
  scheduleName?: string
};

function getBreadcrumbName(url: string, scheduleName: string) {
  switch (url) {
    case `${appPrefix}schedule`:
      return 'Job Scheduler'
    case `${appPrefix}schedule/create`:
      return 'Create Schedule';
  }

  return `Schedule: ${scheduleName}`

}


class JobScheduleBreadcrumb extends React.Component<Props> {

  render() {
    const { location, scheduleName } = this.props;
    const pathSnippets = location.pathname.split('/').filter(i => i && i !== appPrefix.replace(/\//g, ''));
    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
      const url = `${appPrefix}${pathSnippets.slice(0, index + 1).join('/')}`;
      return (
        <Breadcrumb.Item key={url}>
          {
            pathSnippets.length === index + 1 ?
            getBreadcrumbName(url, scheduleName) :
            <Link to={url}>{getBreadcrumbName(url, scheduleName)}</Link>
          }
        </Breadcrumb.Item>
      );
    });
    const breadcrumbItems = [
      <Breadcrumb.Item key="home">
        <Link to={appPrefix}>
          <Icon type="home" />
        </Link>
      </Breadcrumb.Item>,
    ].concat(extraBreadcrumbItems);
    return (
      <Breadcrumb style={{marginBottom: 8}}>
        {breadcrumbItems}
      </Breadcrumb>
    );
  }
}

export default withRouter(JobScheduleBreadcrumb);