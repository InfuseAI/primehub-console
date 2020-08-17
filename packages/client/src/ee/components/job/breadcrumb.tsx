import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {appPrefix} from 'utils/env';

type Props = RouteComponentProps & {
  jobName?: string
};


class JobBreadcrumb extends React.Component<Props> {

  render() {
    const { match, jobName } = this.props;
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
      <Breadcrumb.Item key="job">
        <Link to={`${basename}/job?page=1`}>Jobs</Link>
      </Breadcrumb.Item>
    ];

    if (params.jobId) {
      breadcrumbItems.push(<Breadcrumb.Item key="detail">
        Job: {jobName}
      </Breadcrumb.Item>)
    } else if (match.url.endsWith('job/create')) {
      breadcrumbItems.push(<Breadcrumb.Item key="create">
        Create Job
      </Breadcrumb.Item>)
    }

    return (
      <Breadcrumb style={{marginBottom: 8}}>
        {breadcrumbItems}
      </Breadcrumb>
    );
  }
}

export default withRouter(JobBreadcrumb);
