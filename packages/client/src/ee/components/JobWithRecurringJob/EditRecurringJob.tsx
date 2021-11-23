import React, { useContext } from 'react';
import omit from 'lodash/omit';
import { Spin } from 'antd';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { withRouter, RouteComponentProps, useHistory } from 'react-router-dom';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import { PhSchedule, UpdatePhSchedule } from 'queries/PhRecurringJob.graphql';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import JobForm from './JobForm';
import type { RecurringJob } from './types';
import { GroupContext } from 'context/group';
import { errorHandler } from 'utils/errorHandler';

interface Props extends RouteComponentProps<{ recurringJobId: string }> {
  data: {
    loading: boolean;
    error: Error | undefined;
    phSchedule?: Omit<
      RecurringJob,
      'invalid' | 'message' | 'userId' | 'userName' | 'nextRunTime'
    >;
  };
  updatePhSchedule: ({
    variables,
  }: {
    variables: {
      data: Record<string, unknown>;
      where: {
        id: string;
      };
    };
  }) => Promise<{ id: string }>;
}

function EditRecurringJob({ data, updatePhSchedule }: Props) {
  const { name: groupName } = useContext(GroupContext);
  const { appPrefix } = useRoutePrefix();
  const history = useHistory();
  const breadcrumbs = [
    {
      key: 'recurringJob',
      matcher: /\/recurringJob/,
      title: 'Recurring Job',
      link: '/recurringJob',
    },
    {
      key: 'detail',
      matcher: /\/recurringJob/,
      title: `Recurring Job: ${data?.phSchedule?.displayName || ''}`,
      tips: 'Update the settings of the scheduled job.',
      tipsLink:
        'https://docs.primehub.io/docs/job-scheduling-feature#create-schedule',
    },
  ];

  async function onUpdateRecurringJob({
    id,
    data,
  }: {
    id: string;
    data: Record<string, unknown>;
  }) {
    try {
      await updatePhSchedule({
        variables: {
          data,
          where: {
            id,
          },
        },
      });

      history.push(`${appPrefix}g/${groupName}/recurringJob`);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Spin spinning={data.loading}>
      <JobForm
        editSchedule
        onUpdateRecurringJob={({ id, data }) =>
          onUpdateRecurringJob({ id, data })
        }
        breadcrumbs={
          <PageTitle breadcrumb={<Breadcrumbs pathList={breadcrumbs} />} />
        }
        data={
          data.loading
            ? null
            : {
                ...omit(data?.phSchedule, 'instanceType'),
                instanceTypeId: data?.phSchedule?.instanceType.id,
                instanceType: data?.phSchedule?.instanceType.name,
                instanceTypeName: data?.phSchedule?.instanceType.displayName,
                executeOptions: 'schedule',
              }
        }
      />
    </Spin>
  );
}

export default compose(
  withRouter,
  graphql(PhSchedule, {
    options: ({ match }: Props) => {
      return {
        variables: {
          where: {
            id: match.params.recurringJobId,
          },
        },
        onError: errorHandler,
        fetchPolicy: 'cache-and-network',
      };
    },
  }),
  graphql(UpdatePhSchedule, {
    name: 'updatePhSchedule',
  })
)(EditRecurringJob);
