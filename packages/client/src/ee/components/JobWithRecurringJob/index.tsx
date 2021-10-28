import React, { useContext, useEffect, useReducer } from 'react';
import get from 'lodash/get';
import { Link, useHistory } from 'react-router-dom';
import { Checkbox, Input, Tabs, Modal } from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { withRouter, RouteComponentProps } from 'react-router';

import {
  GroupContext,
  GroupContextValue,
  withGroupContext,
} from 'context/group';
import { useRoutePrefix } from 'hooks/useRoutePrefix/useRoutePrefix';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { errorHandler } from 'utils/errorHandler';

import {
  PhJobsConnection,
  rerunPhJob,
  cancelPhJob,
} from 'queries/PhJob.graphql';

import {
  Job,
  JobList,
  JobConnections,
  JobActionVariables,
  RerunJob,
} from './JobList';

type TabPanelKey = 'job' | 'recurringJob';

interface Props extends RouteComponentProps {
  groupContext: GroupContextValue;
  tab: TabPanelKey;
  jobs: JobConnections;
  rerunPhJob: (variables: JobActionVariables) => Promise<RerunJob>;
  cancelPhJob: (variables: JobActionVariables) => Promise<{ id: string }>;
  // TODO: types
  // schedule: any;
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

function JobWithRecurringJob({ tab, jobs, ...props }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    tab: 'job',
    keyword: '',
    isSubmittedByMe: false,
  });
  const groupContext = useContext(GroupContext);

  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  const routePrefix = `${appPrefix}g/${groupContext.name}`;

  function onRerunJob({
    id,
    displayName,
  }: {
    id: string;
    displayName: string;
  }) {
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
      onOk() {
        props.rerunPhJob({ variables: { where: { id } } });
      },
    });
  }

  function onCancelJob({
    id,
    displayName,
  }: {
    id: string;
    displayName: string;
  }) {
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
      onOk() {
        props.cancelPhJob({ variables: { where: { id } } });
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

  function onSearch() {
    if (state.tab === 'job') {
      jobs.refetch({
        ...jobs.variables,
        page: 1,
        where: {
          ...jobs.variables.where,
          search: state.keyword,
        },
      });

      const nextParams = new URLSearchParams(history.location.search);
      nextParams.set('keyword', state.keyword);

      history.replace({
        pathname: history.location.pathname,
        search: nextParams.toString(),
      });
    }
  }

  function onSearchByMine(value: boolean) {
    if (state.tab === 'job') {
      jobs.refetch({
        ...jobs.variables,
        page: 1,
        where: {
          ...jobs.variables.where,
          mine: value,
        },
      });

      const nextParams = new URLSearchParams(history.location.search);
      nextParams.set('mine', String(value));

      history.replace({
        pathname: history.location.pathname,
        search: nextParams.toString(),
      });
    }
  }

  // Toggle to different panels by routes changed.
  useEffect(() => {
    dispatch({ type: 'TAB', value: tab });
  }, [tab]);

  useEffect(() => {
    const searchParams = new URLSearchParams(history.location.search);
    const page = String(jobs.variables.page) || searchParams.get('page');
    const orderBy = jobs.variables.orderBy || searchParams.get('orderBy');
    const keyword = jobs.variables.where.search || searchParams.get('keyword');
    const mine = String(jobs.variables.where.mine) || searchParams.get('mine');

    const params: {
      page: string;
      orderBy?: string;
      keyword?: string;
      mine?: string;
    } = {
      page,
    };

    if (Object.keys(orderBy).length > 0) {
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
  }, [history, jobs.variables]);

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
            onClick={() => console.log('New Job & Schedule')}
            style={{ marginRight: '16px' }}
            type='primary'
          >
            New Job
          </InfuseButton>
          <InfuseButton
            onClick={() => {
              if (state.tab === 'job') {
                jobs.refetch();
              }
              if (state.tab === 'recurringJob') {
                // recurringJob.refetch();
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
              {...jobs}
              onRerunJob={onRerunJob}
              onCancelJob={onCancelJob}
              onCloneJob={onCloneJob}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab='Recurring Jobs' key='recurringJob'>
            <Link to={`${routePrefix}/next-recurringJob`}>recurring Jobs</Link>
          </Tabs.TabPane>
        </Tabs>
      </PageBody>
    </>
  );
}

function getCurrentQueryVariables({
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
          query: PhJobsConnection,
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
  graphql(PhJobsConnection, {
    name: 'jobs',
    options: getCurrentQueryVariables,
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
  })
)(JobWithRecurringJob);
