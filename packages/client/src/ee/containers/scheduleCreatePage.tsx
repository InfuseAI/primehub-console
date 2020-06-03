import * as React from 'react';
import {Button} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import ScheduleBreadCrumb from 'ee/components/schedule/breadcrumb';
import {errorHandler} from 'ee/components/job/errorHandler';
import ScheduleCreateForm from 'ee/components/job/createForm';
import {GroupFragment} from 'containers/list';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
        instanceTypes { id name displayName description spec global gpuLimit memoryLimit cpuLimit }
        images { id name displayName description spec global type }
      }
    }
  }
  ${GroupFragment}
`

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
`

const compareByAlphabetical = (prev, next) => {
  if(prev < next) return -1;
  if(prev > next) return 1;
  return 0;
}

export const sortItems = (items) => {
  const copiedItems = items.slice();
  copiedItems
    .sort((prev, next) => {
      const prevName = prev.displayName || prev.name;
      const nextName = next.displayName || next.name;
      return compareByAlphabetical(prevName, nextName);
    });
  return copiedItems;
}

type Props = RouteComponentProps & {
  getGroups: any; 
  createPhSchedule: any;
  createPhScheduleResult: any;
  getTimezone: Function;
}
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

  onSubmit = (payload) => {
    const {createPhSchedule} = this.props;
    createPhSchedule({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {selectedGroup} = this.state;
    const {getGroups, getTimezone, createPhScheduleResult, history} = this.props;
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
          title="Create Schedule"
          breadcrumb={<ScheduleBreadCrumb />}
        />
        <div style={{margin: 16}}>
          <ScheduleCreateForm
            onSelectGroup={this.onChangeGroup}
            selectedGroup={selectedGroup}
            groups={sortItems(groups)}
            instanceTypes={sortItems(instanceTypes)}
            images={sortItems(images)}
            onSubmit={this.onSubmit}
            loading={getGroups.loading || createPhScheduleResult.loading}
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
  graphql(GET_MY_GROUPS, {
    name: 'getGroups'
  }),
  graphql(GET_TIMEZONE, {
    name: 'getTimezone'
  }),
  graphql(CREATE_SCHEDULE, {
    options: (props: Props) => ({
      onCompleted: () => {
        props.history.push({
          pathname: `${appPrefix}schedule`,
          search: queryString.stringify({page: 1})
        });
      },
      onError: errorHandler
    }),
    name: 'createPhSchedule'
  })
)(ScheduleCreatePage)
