import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {compose} from 'recompose';
import {Button, Modal} from 'antd';
import queryString from 'querystring';
import ScheduleUpdateForm from 'components/job/createForm';
import ScheduleBreadCrumb from 'components/schedule/breadcrumb';
import Title from 'components/job/title';
import {errorHandler} from 'components/job/errorHandler';
import {PhScheduleFragment} from 'containers/scheduleList';
import {GET_MY_GROUPS, GET_TIMEZONE, sortItems} from 'containers/scheduleCreatePage';
import {get, unionBy, isEqual} from 'lodash';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';

type Props = {
  getGroups: any; 
  getPhSchedule: any;
  updatePhSchedule: Function;
  updatePhScheduleResult: any;
  getTimezone: Function;
} & RouteComponentProps<{
  scheduleId: string;
}>;

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
`

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

class ScheduleDetailContainer extends React.Component<Props> {
  state = {
    selectedGroup: null,
  };

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = (payload) => {
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
    }
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
    history.push(`${appPrefix}schedule`)
  }

  render() {
    const {getPhSchedule, getTimezone, getGroups, history, updatePhScheduleResult} = this.props;
    if (getPhSchedule.loading) return null;
    if (getPhSchedule.error) {
      return getMessage(getPhSchedule.error)
    };
    const selectedGroup = this.state.selectedGroup || get(getPhSchedule, 'phSchedule.groupId');
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []);
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
    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<ScheduleBreadCrumb scheduleName={get(getPhSchedule, 'phSchedule.displayName')} />}
          title={`Schedule: ${get(getPhSchedule, 'phSchedule.displayName')}`}
        />
        <div style={{margin: 16}}>
          <ScheduleUpdateForm
            onSelectGroup={this.onChangeGroup}
            selectedGroup={selectedGroup}
            groups={sortItems(groups)}
            instanceTypes={sortItems(instanceTypes)}
            images={sortItems(images)}
            onSubmit={this.onSubmit}
            loading={getGroups.loading || updatePhScheduleResult.loading}
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
  graphql(GET_MY_GROUPS, {
    name: 'getGroups'
  }),
  graphql(GET_TIMEZONE, {
    name: 'getTimezone'
  }),
  graphql(UPDATE_SCHEDULE, {
    options: (props: Props) => ({
      onCompleted: () => {
        props.history.push({
          pathname: `${appPrefix}schedule`,
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
