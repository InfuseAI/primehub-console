import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import JobDetail from 'components/job/detail';
import {errorHandler} from 'components/job/errorHandler';
import {PhJobFragement} from './jobList';
import {RERUN_JOB, CANCEL_JOB} from 'containers/jobList';

type Props = {
  getPhJob: any;
  rerunPhJob: Function;
  cancelPhJob: Function;
  rerunPhJobResult: any;
  cancelPhJobResult: any;
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

const appPrefix = (window as any).APP_PREFIX || '/';

class JobDetailContainer extends React.Component<Props> {
  render() {
    const {getPhJob, history, rerunPhJob, cancelPhJob, rerunPhJobResult, cancelPhJobResult} = this.props;
    if (getPhJob.loading) return null;
    if (getPhJob.error) return 'Error';
    return (
      <JobDetail
        rerunPhJob={rerunPhJob}
        cancelPhJob={cancelPhJob}
        rerunPhJobResult={rerunPhJobResult}
        cancelPhJobResult={cancelPhJobResult}
        job={getPhJob.phJob || {id: 'test'}}
        appPrefix={appPrefix}
        history={history}
      />
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
      fetchPolicy: 'cache-and-network'
    }),
    name: 'getPhJob'
  }),
  graphql(RERUN_JOB, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_JOB,
        variables: {where: {id: props.match.params.jobId}}
      }],
      onCompleted: () => {
        props.history.goBack();
      },
      onError: errorHandler
    }),
    name: 'rerunPhJob'
  }),
  graphql(CANCEL_JOB, {
    options: (props: Props) => ({
      refetchQueries: [{
        query: GET_PH_JOB,
        variables: {where: {id: props.match.params.jobId}}
      }],
      onCompleted: () => {
        props.history.goBack();
      },
      onError: errorHandler
    }),
    name: 'cancelPhJob'
  })
)(JobDetailContainer)