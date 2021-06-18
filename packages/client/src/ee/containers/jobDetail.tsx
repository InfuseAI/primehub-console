import * as React from 'react';
import { get } from 'lodash';
import { graphql } from 'react-apollo';
import { RouteComponentProps } from 'react-router-dom';
import { compose } from 'recompose';

import JobDetail from 'ee/components/job/detail';
import { errorHandler } from 'utils/errorHandler';
import { appPrefix } from 'utils/env';
import { rerunPhJob, cancelPhJob, phJob } from 'queries/PhJob.graphql';

type Props = {
  getPhJob: any;
  rerunPhJob: () => void;
  cancelPhJob: () => void;
  rerunPhJobResult: any;
  cancelPhJobResult: any;
} & RouteComponentProps<{
  jobId: string;
}>;

const getMessage = (error) =>
  get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH'
    ? `You're not authorized to view this page.`
    : 'Error';

class JobDetailContainer extends React.Component<Props> {
  render() {
    const {
      getPhJob,
      history,
      rerunPhJob,
      cancelPhJob,
      rerunPhJobResult,
      cancelPhJobResult,
    } = this.props;
    if (!getPhJob.phJob) return null;
    if (getPhJob.error) {
      return getMessage(getPhJob.error);
    }
    return (
      <JobDetail
        refetchPhJob={getPhJob.refetch}
        rerunPhJob={rerunPhJob}
        cancelPhJob={cancelPhJob}
        rerunPhJobResult={rerunPhJobResult}
        cancelPhJobResult={cancelPhJobResult}
        job={getPhJob.phJob || { id: 'test' }}
        appPrefix={appPrefix}
        history={history}
      />
    );
  }
}

export default compose(
  graphql(phJob, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.jobId,
        },
      },
      fetchPolicy: 'cache-and-network',
      pollInterval: 2000,
    }),
    name: 'getPhJob',
  }),
  graphql(rerunPhJob, {
    options: (props: Props) => ({
      refetchQueries: [
        {
          query: phJob,
          variables: { where: { id: props.match.params.jobId } },
        },
      ],
      onCompleted: () => {
        props.history.goBack();
      },
      onError: errorHandler,
    }),
    name: 'rerunPhJob',
  }),
  graphql(cancelPhJob, {
    options: (props: Props) => ({
      refetchQueries: [
        {
          query: phJob,
          variables: { where: { id: props.match.params.jobId } },
        },
      ],
      onError: errorHandler,
    }),
    name: 'cancelPhJob',
  })
)(JobDetailContainer);
