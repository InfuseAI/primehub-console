import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps} from 'react-router-dom';
import {compose} from 'recompose';
import JobDetail from 'ee/components/job/detail';
import {errorHandler} from 'utils/errorHandler';
import {PhJobFragment} from './jobList';
import {RERUN_JOB, CANCEL_JOB} from './jobList';
import {get} from 'lodash';
import {appPrefix} from 'utils/env';

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
  ${PhJobFragment}
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

class JobDetailContainer extends React.Component<Props> {
  render() {
    const {getPhJob, history, rerunPhJob, cancelPhJob, rerunPhJobResult, cancelPhJobResult} = this.props;
    if (!getPhJob.phJob) return null;
    if (getPhJob.error) {
      return getMessage(getPhJob.error);
    };
    return (
      <JobDetail
        refetchPhJob={getPhJob.refetch}
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
      fetchPolicy: 'cache-and-network',
      pollInterval: 2000
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
      onError: errorHandler
    }),
    name: 'cancelPhJob'
  })
)(JobDetailContainer)
