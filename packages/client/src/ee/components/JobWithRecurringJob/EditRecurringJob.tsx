import React from 'react';
import omit from 'lodash/omit';
import { Spin } from 'antd';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import { PhSchedule } from 'queries/PhSchedule.graphql';

import JobForm from './JobForm';
import type { Schedule } from './RecurringJobList';

interface Props extends RouteComponentProps<{ recurringJobId: string }> {
  data: {
    loading: boolean;
    error: Error | undefined;
    phSchedule?: Omit<
      Schedule,
      'invalid' | 'message' | 'userId' | 'userName' | 'nextRunTime'
    >;
  };
}

function EditRecurringJob({ data }: Props) {
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/recurringJob/,
      title: 'Jobs',
      link: '/job',
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

  return (
    <Spin spinning={data.loading}>
      <JobForm
        editSchedule
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
        fetchPolicy: 'cache-and-network',
      };
    },
  })
)(EditRecurringJob);
