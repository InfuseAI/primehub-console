import * as React from 'react';
import {Button} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import ScheduleCreateForm from 'ee/components/job/createForm';
import PageTitle from 'components/pageTitle';
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {sortNameByAlphaBet} from 'utils/sorting';
import {CurrentUser} from 'queries/User.graphql';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/schedule/,
    title: 'Schedule',
    link: '/schedule?page=1'
  },
  {
    key: 'create',
    matcher: /\/schedule\/create/,
    title: 'New Schedule',
  }
];

export const CREATE_SCHEDULE = gql`
  mutation createPhSchedule($data: PhScheduleCreateInput!) {
    createPhSchedule(data: $data) {
      id
    }
  }
`;

export const GET_TIMEZONE = gql`
  query system {
    system {
      timezone {
        name
        offset
      }
    }
  }
`;

const compareByAlphabetical = (prev, next) => {
  if (prev < next) return -1;
  if (prev > next) return 1;
  return 0;
};

type Props = RouteComponentProps & GroupContextComponentProps & {
  currentUser: any;
  createPhSchedule: any;
  createPhScheduleResult: any;
  getTimezone: Function;
};

type State = {
  selectedGroup: string | null;
}

class ScheduleCreatePage extends React.Component<Props, State> {
  state = {
    selectedGroup: null,
  };

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = payload => {
    const {createPhSchedule} = this.props;
    createPhSchedule({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {selectedGroup} = this.state;
    const {groupContext, currentUser, getTimezone, createPhScheduleResult, history} = this.props;
    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const allGroups = get(currentUser, 'me.groups', []);
    const groups = allGroups
      .filter(group => group.id !== everyoneGroupId)
      .filter(group => !groupContext || groupContext.id === group.id );
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

    const jobActiveDeadlineSeconds = get(group, 'jobDefaultActiveDeadlineSeconds', null) || (window as any).jobDefaultActiveDeadlineSeconds;

    return (
      <React.Fragment>
        <PageTitle
          title="New Schedule"
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        />
        <div style={{margin: 16}}>
          <ScheduleCreateForm
            groupContext={groupContext}
            onSelectGroup={this.onChangeGroup}
            selectedGroup={selectedGroup}
            groups={sortNameByAlphaBet(groups)}
            instanceTypes={sortNameByAlphaBet(instanceTypes)}
            images={sortNameByAlphaBet(images)}
            defaultActiveDeadlineSeconds={jobActiveDeadlineSeconds}
            onSubmit={this.onSubmit}
            loading={currentUser.loading || createPhScheduleResult.loading}
            timezone={get(getTimezone, 'system.timezone')}
            type="schedule"
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
  graphql(CREATE_SCHEDULE, {
    options: (props: Props) => ({
      onCompleted: () => {
        props.history.push({
          pathname: `../schedule`,
          search: queryString.stringify({page: 1})
        });
      },
      onError: errorHandler
    }),
    name: 'createPhSchedule'
  })
)(ScheduleCreatePage)
