import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {RouteComponentProps, withRouter} from 'react-router-dom';
import {compose} from 'recompose';
import {Button} from 'antd';
import queryString from 'querystring';
import ScheduleUpdateForm from 'components/job/createForm';
import Title from 'components/job/title';
import {errorHandler} from 'components/job/errorHandler';
import {PhScheduleFragment} from 'containers/scheduleList';
import {GET_MY_GROUPS, GET_TIMEZONE, sortItems} from 'containers/scheduleCreatePage';
import {get, unionBy} from 'lodash';

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

const appPrefix = (window as any).APP_PREFIX || '/';

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
        <Button
          icon="left"
          onClick={() => history.push(`${appPrefix}schedule`)}
          style={{marginRight: 16, verticalAlign: 'top'}}
        >
          Back
        </Button>
        <Title>Schedule: {get(getPhSchedule, 'phSchedule.displayName')}</Title>
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
            displayName: get(getPhSchedule, 'phSchedule.displayName'),
            groupId: get(getPhSchedule, 'phSchedule.groupId'),
            groupName: get(getPhSchedule, 'phSchedule.groupName'),
            image: get(getPhSchedule, 'phSchedule.image'),
            command: get(getPhSchedule, 'phSchedule.command'),
            recurrence: get(getPhSchedule, 'phSchedule.recurrence'),
            instanceTypeId: get(getPhSchedule, 'phSchedule.instanceType.id'),
            instanceTypeName: get(getPhSchedule, 'phSchedule.instanceType.name')
          }}
        />
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
        const groups = get(props.getGroups, 'me.groups', []);
        const where = JSON.stringify({
          groupId_in: groups.map(group => group.id)
        });
        props.history.push({
          pathname: `${appPrefix}schedule`,
          search: queryString.stringify({where, first: 10})
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
