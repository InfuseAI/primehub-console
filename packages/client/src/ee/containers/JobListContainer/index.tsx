import * as React from 'react';
import queryString from 'querystring';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

import JobList from 'ee/components/job/list';
import { errorHandler } from 'utils/errorHandler';
import { Group } from 'ee/components/shared/groupFilter';
import {
  PhJobsConnection,
  rerunPhJob,
  cancelPhJob,
} from 'queries/PhJob.graphql';
import type { GroupContextComponentProps } from 'context/group';

type Props = {
  getPhJobConnection?: any;
  groups: Array<Group>;
  rerunPhJob: any;
  cancelPhJob: any;
  rerunPhJobResult: any;
  cancelPhJobResult: any;
} & RouteComponentProps &
  GroupContextComponentProps;

class JobListContainer extends React.Component<Props> {
  jobsRefetch = (payload) => {
    const payloadWithStringWhere = { ...payload };
    if (payloadWithStringWhere.where)
      payloadWithStringWhere.where = JSON.stringify(payload.where);
    if (payloadWithStringWhere.orderBy)
      payloadWithStringWhere.orderBy = JSON.stringify(payload.orderBy || {});

    const { history, getPhJobConnection } = this.props;
    const search = queryString.stringify(payloadWithStringWhere);
    if (history.location.search === `?${search}`) {
      getPhJobConnection.refetch(payload);
    } else {
      history.replace({
        pathname: `job`,
        search,
      });
    }
  };

  render() {
    const {
      groupContext,
      getPhJobConnection,
      rerunPhJob,
      rerunPhJobResult,
      cancelPhJobResult,
      cancelPhJob,
      groups,
    } = this.props;

    return (
      <JobList
        groupContext={groupContext}
        jobsLoading={getPhJobConnection.loading}
        jobsError={getPhJobConnection.error}
        jobsConnection={
          getPhJobConnection.phJobsConnection || { pageInfo: {}, edges: [] }
        }
        jobsVariables={getPhJobConnection.variables}
        jobsRefetch={this.jobsRefetch}
        rerunPhJob={rerunPhJob}
        rerunPhJobResult={rerunPhJobResult}
        cancelPhJobResult={cancelPhJobResult}
        cancelPhJob={cancelPhJob}
        groups={groups}
      />
    );
  }
}

export default compose(
  withRouter,
  graphql(PhJobsConnection, {
    options: (props: Props) => {
      const params = queryString.parse(
        props.location.search.replace(/^\?/, '')
      );
      const { groupContext } = props;
      const where = JSON.parse((params.where as string) || '{}');
      if (groupContext) {
        where.groupId_in = [groupContext.id];
      }

      return {
        variables: {
          where,
          orderBy: JSON.parse((params.orderBy as string) || '{}'),
          page: Number(params.page || 1),
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getPhJobConnection',
  }),
  graphql(rerunPhJob, {
    options: (props: Props) => ({
      refetchQueries: [
        {
          query: PhJobsConnection,
          variables: props.getPhJobConnection.variables,
        },
      ],
      onError: errorHandler,
    }),
    name: 'rerunPhJob',
  }),
  graphql(cancelPhJob, {
    options: (props: Props) => ({
      refetchQueries: [
        {
          query: PhJobsConnection,
          variables: props.getPhJobConnection.variables,
        },
      ],
      onError: errorHandler,
    }),
    name: 'cancelPhJob',
  })
)(JobListContainer);
