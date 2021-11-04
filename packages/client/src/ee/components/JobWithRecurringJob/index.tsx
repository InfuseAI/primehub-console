import React, { useContext, useEffect, useReducer } from 'react';
import get from 'lodash/get';
import { useHistory, withRouter, RouteComponentProps } from 'react-router-dom';
import { Checkbox, Input, Tabs, Modal, notification } from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import {
  GroupContext,
  GroupContextValue,
  withGroupContext,
} from 'context/group';
import { useRoutePrefix } from 'hooks/useRoutePrefix/useRoutePrefix';
import {
  PhJobsConnection,
  rerunPhJob,
  cancelPhJob,
} from 'queries/PhJob.graphql';
import {
  PhSchedulesConnection,
  RunPhSchedule,
  DeletePhSchedule,
} from 'queries/PhSchedule.graphql';
import { errorHandler } from 'utils/errorHandler';

import {
  Job,
  JobList,
  JobConnections,
  JobActionVariables,
  RerunJob,
} from './JobList';
import {
  RecurringJobList,
  ScheduleConnections,
  ScheduleActionVariables,
  RunSchedule,
} from './RecurringJobList';
import type { ActionInfo } from './types';

type TabPanelKey = 'job' | 'recurringJob';

interface Props extends RouteComponentProps {
  groupContext: GroupContextValue;
  tab: TabPanelKey;
  jobs?: JobConnections;
  rerunPhJob: (variables: JobActionVariables) => Promise<RerunJob>;
  cancelPhJob: (variables: JobActionVariables) => Promise<{ id: string }>;
  recurringJobs?: ScheduleConnections;
  runPhSchedule: (variables: ScheduleActionVariables) => Promise<RunSchedule>;
  deletePhSchedule: (
    variables: ScheduleActionVariables
  ) => Promise<{ id: string }>;
}

type State = {
  tab: TabPanelKey;
  keyword: string;
  isSubmittedByMe: boolean;
};

type Actions =
  | { type: 'TAB'; value: TabPanelKey }
  | { type: 'KEYWORD'; value: string }
  | { type: 'IS_SUBMITTED_BY_ME'; value: boolean }
  | { type: 'TOGGLE'; value: string };

function reducer(state: State, action: Actions) {
  switch (action.type) {
    case 'TAB':
      return {
        ...state,
        tab: action.value,
      };
    case 'KEYWORD':
      return {
        ...state,
        keyword: action.value,
      };
    case 'IS_SUBMITTED_BY_ME':
      return {
        ...state,
        isSubmittedByMe: action.value,
      };

    case 'TOGGLE':
      return {
        ...state,
        keyword: '',
        isSubmittedByMe: false,
      };
  }
}

function JobWithRecurringJob({ tab, jobs, recurringJobs, ...props }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    tab: 'job',
    keyword: '',
    isSubmittedByMe: false,
  });
  const groupContext = useContext(GroupContext);

  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  const routePrefix = `${appPrefix}g/${groupContext.name}`;

  function onRerunJob({ id, displayName }: ActionInfo) {
    Modal.confirm({
      title: 'Rerun Job',
      content: (
        <>
          Do you want to rerun <b>{displayName}</b>?
        </>
      ),
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      maskClosable: true,
      onOk: async () => {
        try {
          await props.rerunPhJob({ variables: { where: { id } } });
        } catch (err) {
          console.error(err);
          errorHandler(err);
        }
      },
    });
  }

  function onCancelJob({ id, displayName }: ActionInfo) {
    Modal.confirm({
      title: 'Cancel Job',
      content: (
        <>
          Do you want to cancel <b>{displayName}</b>?
        </>
      ),
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      maskClosable: true,
      onOk: async () => {
        try {
          await props.cancelPhJob({ variables: { where: { id } } });
        } catch (err) {
          console.error(err);
          errorHandler(err);
        }
      },
    });
  }

  function onCloneJob(job: Job) {
    const data = {
      displayName: job.displayName,
      groupId: !groupContext ? job.groupId : groupContext.id,
      groupName: !groupContext ? job.groupName : groupContext.name,
      instanceTypeId: get(job, 'instanceType.id'),
      instanceTypeName:
        get(job, 'instanceType.displayName') || get(job, 'instanceType.name'),
      image: job.image,
      command: job.command,
    };

    history.push(
      `job/create?defaultValue=${encodeURIComponent(JSON.stringify(data))}`
    );
  }

  async function onRunRecurringJob({
    id,
    displayName,
  }: ActionInfo): Promise<void> {
    try {
      const { data } = await props.runPhSchedule({
        variables: {
          where: {
            id,
          },
        },
      });

      const modal = Modal.success({
        title: 'Success',
        maskClosable: true,
        content: (
          <div>
            <b>{displayName}</b> has been submitted! You can
            <a
              onClick={() => {
                props.history.push(`job/${data.runPhSchedule.job.id}`);
                modal.destroy();
              }}
            >
              {' '}
              <u>view your job details here.</u>
            </a>
          </div>
        ),
      });
    } catch (err) {
      console.error(err);
      errorHandler(err);
    }
  }

  function onDeleteRecurringJob({ id, displayName }: ActionInfo) {
    Modal.confirm({
      title: 'Delete',
      content: (
        <>
          Are you sure you want to delete <b>{displayName}</b>?
        </>
      ),
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      maskClosable: true,
      onOk: async () => {
        try {
          await props.deletePhSchedule({
            variables: {
              where: {
                id,
              },
            },
          });

          notification.success({
            duration: 5,
            placement: 'bottomRight',
            message: 'Deleted Successfully!',
            description: (
              <>
                Your schedule <b>{displayName}</b> have been deleted.
              </>
            ),
          });
        } catch (err) {
          console.error(err);
          errorHandler(err);
        }
      },
    });
  }

  function onSearch() {
    if (state.tab === 'job') {
      jobs?.refetch({
        ...jobs?.variables,
        page: 1,
        where: {
          ...jobs?.variables.where,
          search: state.keyword,
        },
      });
    }

    if (state.tab === 'recurringJob') {
      recurringJobs?.refetch({
        ...recurringJobs?.variables,
        page: 1,
        where: {
          ...recurringJobs?.variables.where,
          search: state.keyword,
        },
      });
    }

    const nextParams = new URLSearchParams(history.location.search);
    nextParams.set('keyword', state.keyword);

    history.replace({
      pathname: history.location.pathname,
      search: nextParams.toString(),
    });
  }

  function onSearchByMine(value: boolean) {
    if (state.tab === 'job') {
      jobs?.refetch({
        ...jobs?.variables,
        page: 1,
        where: {
          ...jobs?.variables.where,
          mine: value,
        },
      });
    }

    if (state.tab === 'recurringJob') {
      recurringJobs?.refetch({
        ...recurringJobs?.variables,
        page: 1,
        where: {
          ...recurringJobs?.variables.where,
          mine: value,
        },
      });
    }

    const nextParams = new URLSearchParams(history.location.search);
    nextParams.set('mine', String(value));

    history.replace({
      pathname: history.location.pathname,
      search: nextParams.toString(),
    });
  }

  // Toggle to different panels by routes changed.
  useEffect(() => {
    dispatch({ type: 'TAB', value: tab });
  }, [jobs, tab]);

  useEffect(() => {
    let page;
    let orderBy;
    let keyword;
    let mine;

    const searchParams = new URLSearchParams(history.location.search);

    if (state.tab === 'job') {
      page = String(jobs?.variables.page) || searchParams.get('page');
      orderBy = jobs?.variables.orderBy || searchParams.get('orderBy');
      keyword = jobs?.variables.where.search || searchParams.get('keyword');
      mine = String(jobs?.variables.where.mine) || searchParams.get('mine');
    }

    if (state.tab === 'recurringJob') {
      page = String(recurringJobs?.variables.page) || searchParams.get('page');
      orderBy = recurringJobs?.variables.orderBy || searchParams.get('orderBy');
      keyword =
        recurringJobs?.variables.where.search || searchParams.get('keyword');
      mine =
        String(recurringJobs?.variables.where.mine) || searchParams.get('mine');
    }

    const params: {
      page: string;
      orderBy?: string;
      keyword?: string;
      mine?: string;
    } = {
      page,
    };

    if (orderBy && Object.keys(orderBy).length > 0) {
      params.orderBy = JSON.stringify(orderBy);
    }

    if (keyword) {
      params.keyword = keyword;
      dispatch({ type: 'KEYWORD', value: keyword });
    }

    params.mine = mine;
    dispatch({ type: 'IS_SUBMITTED_BY_ME', value: mine === 'true' });

    history.replace({
      pathname: history.location.pathname,
      search: new URLSearchParams(params).toString(),
    });
  }, [history, state.tab, jobs?.variables, recurringJobs?.variables]);

  return (
    <>
      <PageTitle
        title='Jobs'
        breadcrumb={
          <Breadcrumbs
            pathList={[
              {
                key: 'job-list',
                // FIXME: matcher name
                matcher: /\/next-(job|recurringJob)/,
                title: 'Jobs',
                link: '/next-job',
                tips: 'Users can submit time-consuming tasks as jobs here.',
                tipsLink:
                  'https://docs.primehub.io/docs/job-submission-feature',
              },
            ]}
          />
        }
      />
      <PageBody>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <InfuseButton
            icon='plus'
            onClick={() => history.push('job/create')}
            style={{ marginRight: '16px' }}
            type='primary'
          >
            New Job
          </InfuseButton>
          <InfuseButton
            onClick={() => {
              if (state.tab === 'job') {
                jobs?.refetch();
              }
              if (state.tab === 'recurringJob') {
                recurringJobs?.refetch();
              }
            }}
          >
            Refresh
          </InfuseButton>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '16px',
          }}
        >
          <Input.Search
            data-testid='search-by-text'
            placeholder='Search Jobs'
            value={state.keyword}
            onSearch={onSearch}
            onChange={event =>
              dispatch({ type: 'KEYWORD', value: event.currentTarget.value })
            }
          />
          <Checkbox
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: '4.5px 8px',
              width: '190px',
            }}
            checked={state.isSubmittedByMe}
            onChange={event => {
              const value = event.target.checked;
              dispatch({
                type: 'IS_SUBMITTED_BY_ME',
                value,
              });
              onSearchByMine(value);
            }}
          >
            Submitted By Me
          </Checkbox>
        </div>

        <Tabs
          style={{ paddingTop: 8 }}
          activeKey={state.tab}
          onTabClick={tab => {
            dispatch({ type: 'TOGGLE', value: tab });

            // FIXME: route name
            history.replace(`${routePrefix}/next-${tab}`);
          }}
        >
          <Tabs.TabPane tab='Jobs' key='job'>
            <JobList
              data={jobs}
              onRerunJob={onRerunJob}
              onCancelJob={onCancelJob}
              onCloneJob={onCloneJob}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab='Recurring Jobs' key='recurringJob'>
            <RecurringJobList
              data={recurringJobs}
              onRunRecurringJob={onRunRecurringJob}
              onDeleteRecurringJob={onDeleteRecurringJob}
            />
          </Tabs.TabPane>
        </Tabs>
      </PageBody>
    </>
  );
}

function getCurrentQueryVariables({
  tab,
  location,
  groupContext,
  ...props
}: Props & { mutation?: boolean }) {
  const searchParams = new URLSearchParams(location.search);
  const currentPage = searchParams.get('page');
  const currentKeyword = searchParams.get('keyword');
  const currnetIsSubmittedByMine = searchParams.get('mine');
  const currentOrderBy = JSON.parse(searchParams.get('orderBy'));

  const variables = {
    page: Number(currentPage) || 1,
    where: {
      groupId_in: [groupContext.id],
      search: currentKeyword || '',
      mine: currnetIsSubmittedByMine === 'true' || false,
    },
    orderBy: currentOrderBy || {},
  };

  if (props?.mutation) {
    return {
      refetchQueries: [
        {
          query: tab === 'job' ? PhJobsConnection : PhSchedulesConnection,
          variables,
        },
      ],
      onError: errorHandler,
    };
  }

  return {
    variables,
    onError: errorHandler,
    fetchPolicy: 'cache-and-network',
  };
}

export default compose(
  withRouter,
  withGroupContext,

  // PhJob
  graphql(PhJobsConnection, {
    name: 'jobs',
    options: getCurrentQueryVariables,
    skip: (props: Props) => {
      // skip query when tab is recurring job
      if (props.tab === 'recurringJob') {
        return true;
      }
    },
  }),
  graphql(rerunPhJob, {
    name: 'rerunPhJob',
    options: (props: Props) =>
      getCurrentQueryVariables({ ...props, mutation: true }),
  }),
  graphql(cancelPhJob, {
    name: 'cancelPhJob',
    options: (props: Props) =>
      getCurrentQueryVariables({ ...props, mutation: true }),
  }),

  // PhSchedule
  graphql(PhSchedulesConnection, {
    name: 'recurringJobs',
    options: getCurrentQueryVariables,
    skip: (props: Props) => {
      // skip query when tab is job
      if (props.tab === 'job') {
        return true;
      }
    },
  }),
  graphql(RunPhSchedule, {
    name: 'runPhSchedule',
    options: (props: Props) =>
      getCurrentQueryVariables({ ...props, mutation: true }),
  }),
  graphql(DeletePhSchedule, {
    name: 'deletePhSchedule',
    options: (props: Props) =>
      getCurrentQueryVariables({ ...props, mutation: true }),
  })
)(JobWithRecurringJob);
