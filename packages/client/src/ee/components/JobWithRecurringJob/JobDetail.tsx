import React, { useContext } from 'react';
import { useHistory, withRouter, RouteComponentProps } from 'react-router-dom';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { GroupContext } from 'context/group';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';
import { phJob, rerunPhJob, cancelPhJob } from 'queries/PhJob.graphql';

import { JobInformation } from './JobInformation';
import type { Job, JobActionVariables, RerunJob } from './types';

interface Props extends RouteComponentProps<{ jobId: string }> {
  data: {
    error: Error | undefined;
    loading: boolean;
    phJob: Job;
  };
  rerunPhJob: (variables: JobActionVariables) => Promise<RerunJob>;
  cancelPhJob: (variables: JobActionVariables) => Promise<{ id: string }>;
}

function JobDetail({ data, ...props }: Props) {
  const { name: groupName } = useContext(GroupContext);
  const { appPrefix } = useRoutePrefix();
  const history = useHistory();

  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/job/,
      title: 'Jobs',
      link: '/job?page=1',
    },
    {
      key: 'detail',
      matcher: /\/job\/([\w-])+/,
      title: `Job: ${data?.phJob?.displayName || ''}`,
      tips: 'View the detailed information.',
      tipsLink: 'https://docs.primehub.io/docs/job-submission-feature#view-job',
    },
  ];

  async function onRerunJob(id: string) {
    try {
      await props.rerunPhJob({
        variables: {
          where: {
            id,
          },
        },
      });
      history.push(`${appPrefix}g/${groupName}/job`);
    } catch (err) {
      console.error(err);
      errorHandler(err);
    }
  }

  async function onCancelJob(id: string) {
    try {
      await props.cancelPhJob({
        variables: {
          where: {
            id,
          },
        },
      });
    } catch (err) {
      console.error(err);
      errorHandler(err);
    }
  }

  function onCloneJob(job: Job) {
    const data = {
      displayName: job.displayName,
      groupId: job.groupId,
      groupName: job.groupName,
      instanceTypeId: job.instanceType.id,
      instanceTypeName: job.instanceType.displayName || job.instanceType.name,
      image: job.image,
      command: job.command,
    };

    history.push(
      `create?defaultValue=${encodeURIComponent(JSON.stringify(data))}`
    );
  }

  return (
    <>
      <PageTitle breadcrumb={<Breadcrumbs pathList={breadcrumbs} />} />
      <PageBody>
        <JobInformation
          job={data?.phJob}
          rerunPhJob={id => onRerunJob(id)}
          cancelPhJob={id => onCancelJob(id)}
          cloneJob={(job: Job) => onCloneJob(job)}
        />
      </PageBody>
    </>
  );
}

export default compose(
  withRouter,
  graphql(phJob, {
    options: ({ match }: Props) => ({
      variables: {
        where: {
          id: match.params.jobId,
        },
      },
      fetchPolicy: 'cache-and-network',
      pollInterval: 10000,
    }),
  }),
  graphql(rerunPhJob, {
    name: 'rerunPhJob',
    options: ({ match }: Props) => ({
      refetchQueries: [
        {
          query: phJob,
          variables: {
            where: {
              id: match.params.jobId,
            },
          },
        },
      ],
      onError: errorHandler,
    }),
  }),
  graphql(cancelPhJob, {
    name: 'cancelPhJob',
    options: ({ match }: Props) => ({
      refetchQueries: [
        {
          query: phJob,
          variables: {
            where: {
              id: match.params.jobId,
            },
          },
        },
      ],
      onError: errorHandler,
    }),
  })
)(JobDetail);
