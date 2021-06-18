import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {compose} from 'recompose';
import {Button, Modal} from 'antd';
import queryString from 'querystring';
import ScheduleUpdateForm from 'ee/components/job/createForm';
import Title from 'ee/components/job/title';
import {errorHandler} from 'utils/errorHandler';
import {PhScheduleFragment} from 'ee/containers/scheduleList';
import {GET_TIMEZONE} from 'ee/containers/ScheduleCreatePage';
import {get, unionBy, isEqual} from 'lodash';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {sortNameByAlphaBet} from 'utils/sorting';
import {CurrentUser} from 'queries/User.graphql';

type Props = {
  currentUser: any;
  getPhSchedule: any;
  updatePhSchedule: Function;
  updatePhScheduleResult: any;
  getTimezone: Function;
} & RouteComponentProps<{
  scheduleId: string;
}> & GroupContextComponentProps;

export const GET_PH_SCHEDULE = gql`
  query phSchedule($where: PhScheduleWhereUniqueInput!) {
    phSchedule(where: $where) {
      ...PhScheduleInfo
    }
  }
  ${PhScheduleFragment}
`;

export const UPDATE_SCHEDULE = gql`
  mutation updatePhSchedule($data: PhScheduleUpdateInput!, $where: PhScheduleWhereUniqueInput!) {
    updatePhSchedule(data: $data, where: $where) {
      id
    }
  }
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

class ScheduleDetailContainer extends React.Component<Props> {
  state = {
    selectedGroup: null,
  };

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = payload => {
    const {updatePhSchedule, getPhSchedule} = this.props;
    const id = get(getPhSchedule, 'phSchedule.id');
    delete payload.recurrence.__typename;
    updatePhSchedule({
      variables: {
        data: payload,
        where: {
          id
        }
      }
    });
  }

  cancel = values => {
    const {history, getPhSchedule} = this.props;
    const initialValue = {
      instanceType: get(getPhSchedule, 'phSchedule.instanceType.id'),
      image: get(getPhSchedule, 'phSchedule.image'),
      groupId: get(getPhSchedule, 'phSchedule.groupId'),
      displayName: get(getPhSchedule, 'phSchedule.displayName'),
      command: get(getPhSchedule, 'phSchedule.command'),
      recurrence: get(getPhSchedule, 'phSchedule.recurrence'),
    };
    if (isEqual(values, initialValue))
      return this.back();

    Modal.confirm({
      title: 'Do you want to discard the changes?',
      content: 'Your changes will be lost. Are you sure?',
      okText: 'Discard',
      cancelText: 'Cancel',
      onOk: this.back,
      cancelButtonProps: {
        style: {
          float: 'right',
          marginLeft: 8
        }
      }
    });
  }

  back = () => {
    const {history} = this.props;
    const pathname = get(history, 'location.state.prevPathname');
    const search = get(history, 'location.state.prevSearch');
    if (pathname)
      return history.push(`${pathname}${search}`)
    history.push(`$../schedule`)
  }

  render() {
    const {groupContext, getPhSchedule, getTimezone, currentUser, history, updatePhScheduleResult} = this.props;
    if (getPhSchedule.loading) return null;
    if (getPhSchedule.error) {
      return getMessage(getPhSchedule.error)
    };
    const selectedGroup = this.state.selectedGroup || get(getPhSchedule, 'phSchedule.groupId');
    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const allGroups = get(currentUser, 'me.groups', []);
    const groups = allGroups.filter(group => group.id !== everyoneGroupId);
    const everyoneGroup = allGroups.find(group => group.id === everyoneGroupId);
    const group = groups
      .find(group => group.id === selectedGroup);
    const instanceTypes = unionBy(
      get(group, 'instanceTypes', []),
      get(everyoneGroup, 'instanceTypes', []),
      'id'
    );
    const images = unionBy(
      get(group, 'images', []),
      get(everyoneGroup, 'images', []),
      'id'
    );

    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/schedule/,
        title: 'Schedule',
        link: '/schedule?page=1'
      },
      {
        key: 'update',
        matcher: /\/schedule\/([\w-])+/,
        title: `Schedule: ${get(getPhSchedule, 'phSchedule.displayName')}`,
        tips: 'Update the settings of the scheduled job.',
        tipsLink: 'https://docs.primehub.io/docs/job-scheduling-feature#create-schedule'
      }
    ];

    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={`Schedule: ${get(getPhSchedule, 'phSchedule.displayName')}`}
        />
        <div style={{margin: 16}}>
          <ScheduleUpdateForm
            groupContext={groupContext}
            onSelectGroup={this.onChangeGroup}
            selectedGroup={selectedGroup}
            groups={sortNameByAlphaBet(groups)}
            instanceTypes={sortNameByAlphaBet(instanceTypes)}
            images={sortNameByAlphaBet(images)}
            onSubmit={this.onSubmit}
            loading={currentUser.loading || updatePhScheduleResult.loading}
            type="schedule"
            timezone={get(getTimezone, 'system.timezone')}
            initialValue={{
              ...get(getPhSchedule, 'phSchedule', {}) || {},
              instanceTypeId: get(getPhSchedule, 'phSchedule.instanceType.id'),
              instanceTypeName: get(getPhSchedule, 'phSchedule.instanceType.name'),
            }}
            submitText="Confirm"
            onCancel={this.cancel}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(CurrentUser, {
    alias: 'withCurrentUser',
    name: 'currentUser'
  }),
  graphql(GET_TIMEZONE, {
    name: 'getTimezone'
  }),
  graphql(UPDATE_SCHEDULE, {
    options: (props: Props) => ({
      onCompleted: () => {
        props.history.push({
          pathname: `../schedule`,
          search: queryString.stringify({page: 1})
        });
      },
      onError: errorHandler
    }),
    name: 'updatePhSchedule'
  }),
  graphql(GET_PH_SCHEDULE, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.scheduleId
        }
      },
      fetchPolicy: 'cache-and-network'
    }),
    name: 'getPhSchedule'
  })
)(ScheduleDetailContainer)
