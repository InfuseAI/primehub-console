import * as React from 'react';
import gql from 'graphql-tag';
import {Button} from 'antd';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import JobDetail from 'components/job/detail';
import {PhJobFragement} from './jobList';
import {Phase} from 'components/job/phase';

type Props = {
  getPhJob: any;
} & RouteComponentProps<{
  jobId: string;
}>;

export const GET_PH_JOB = gql`
  query phJob($where: PhJobWhereUniqueInput!) {
    phJob(where: $where) {
      ...PhJobInfo
    }
  }
  ${PhJobFragement}
`;

class JobDetailContainer extends React.Component<Props> {
  render() {
    const {getPhJob, history} = this.props;
    if (getPhJob.loading) return null;
    if (getPhJob.error) return 'Error';
    return (
      <React.Fragment>
        <Button
          icon="left"
          onClick={() => history.goBack()}
          style={{marginBottom: 16}}
        >
          Back
        </Button>
        <JobDetail
          job={getPhJob.phJob}
        />
      </React.Fragment>
    );
  }
}

export default compose(
  graphql(GET_PH_JOB, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.jobId
        }
      },
    }),
    name: 'getPhJob'
  }),
)(JobDetailContainer)