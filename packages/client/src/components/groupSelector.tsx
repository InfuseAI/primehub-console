import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {Select} from 'antd';
import {get} from 'lodash';
import queryString from 'querystring';
import {withRouter} from 'react-router';
import {RouteComponentProps} from 'react-router-dom';
import withPath, { PathComponentProps } from 'ee/components/job/withPath';
import {appPrefix} from 'utils/env';

const { Option } = Select;

export const GroupFragment = gql`
  fragment GroupInfo on Group {
    id
    displayName
    name
    enabledDeployment
  }
`;

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
      }
    }
  }
  ${GroupFragment}
`


type Props = {
  getMyGroups: any;
} & RouteComponentProps
  & PathComponentProps;

type State = {
  currentGroupId: string
}

class GroupSelector extends React.Component<Props> {
  groups = [];
  constructor(props) {
    super(props);

    this.state = {
      currentGroupId: ''
    };
  }

  onSelectGroup (id) {
    const {history} = this.props;
    history.push(`${(window as any).APP_PREFIX}console/g/${id}/home`);
  }

  handleChange = (id) => {
    this.onSelectGroup(id);
    this.setState({currentGroupId: id});
  }

  componentDidMount() {
    const {match} = this.props;
    const currentGroupId = (match.params as any).groupId || null;
    if (currentGroupId) {
      this.setState({currentGroupId});
    }
  }

  render() {
    const {
      getMyGroups,
      history,
      match
    } = this.props;
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    if (getMyGroups.loading) return null;
    if (getMyGroups.error) return 'Error';

    const groups = get(getMyGroups, 'me.groups', [])
      .filter(group => group.id !== everyoneGroupId);

    this.groups = groups;

    return (
      <div
        style={{ lineHeight: '64px'}}
      >
        <label style={{marginRight: '5px'}}>
          Group:
        </label>
        <Select size={'small'} value={this.state.currentGroupId} placeholder="Please select a group" onChange={this.handleChange} style={{width: "160px", fontSize: "12px"}}>
          {groups.map(group => (
            <Option key={group.id} value={group.id}>
              {group.displayName || group.name}
            </Option>
          ))}
        </Select>
      </div>
    )
  }
}

export default compose(
  withRouter,
  withPath,
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: Props) => ({
      onCompleted: data => {
        if (!data.me && !data.me.groups) return;
        if (props.match.params.groupId) return;
        let firstGroup = data.me.groups[0];
        (window as any).location.href = `${appPrefix}console/g/${firstGroup.id}/home`;
      },
      fetchPolicy: 'cache-and-network'
    }),
  })
)(GroupSelector)