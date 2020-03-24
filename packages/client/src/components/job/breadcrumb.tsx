import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';

type Props = RouteComponentProps & {
  jobName?: string
};

const appPrefix = (window as any).APP_PREFIX || '/';

function getBreadcrumbName(url: string, jobName: string) {
  switch (url) {
    case `${appPrefix}job`:
      return 'Job Submission'
    case `${appPrefix}job/create`:
      return 'Create Job';
  }

  return `Job: ${jobName}`

}


class JobScheduleBreadcrumb extends React.Component<Props> {

  render() {
    const { location, jobName } = this.props;
    const pathSnippets = location.pathname.split('/').filter(i => i && i !== appPrefix.replace('/',''));
    const extraBreadcrumbItems = pathSnippets.map((_, index) => {
      const url = `${appPrefix}${pathSnippets.slice(0, index + 1).join('/')}`;
      return (
        <Breadcrumb.Item key={url}>
          {
            pathSnippets.length === index + 1 ?
            getBreadcrumbName(url, jobName) :
            <Link to={url}>{getBreadcrumbName(url, jobName)}</Link>
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