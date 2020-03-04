import * as React from 'react';
import {Button, notification} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import Title from 'components/job/title';
import {errorHandler} from 'components/job/errorHandler';
import ScheduleCreateForm from 'components/job/createForm';
import {GroupFragment} from 'containers/list';

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
`

const compareByAlphabetical = (prev, next) => {
  if(prev < next) return -1;
  if(prev > next) return 1;
  return 0;
}

const sortItems = (items) => {
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
}
type State = {
  selectedGroup: string | null;
}

const appPrefix = (window as any).APP_PREFIX || '/';
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
    const {getGroups, createPhScheduleResult, history} = this.props;
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
          onClick={() => history.goBack()}
          style={{marginRight: 16, verticalAlign: 'top'}}
        >
          Back
        </Button>
        <Title>Create Schedule</Title>
        <ScheduleCreateForm
          onSelectGroup={this.onChangeGroup}
          selectedGroup={selectedGroup}
          groups={sortItems(groups)}
          instanceTypes={sortItems(instanceTypes)}
          images={sortItems(images)}
          onSubmit={this.onSubmit}
          creating={createPhScheduleResult.loading || false}
          loading={getGroups.loading}
          type="schedule"
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
  graphql(CREATE_SCHEDULE, {
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
    name: 'createPhSchedule'
  })
)(ScheduleCreatePage)
