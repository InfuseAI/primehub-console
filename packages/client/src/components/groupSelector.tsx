import * as React from 'react';
import {compose} from 'recompose';
import {Select} from 'antd';
import {get} from 'lodash';
import {withRouter} from 'react-router';
import {RouteComponentProps} from 'react-router-dom';
import {appPrefix} from 'utils/env';
import PHTooltip from 'components/share/toolTip';

const { Option } = Select;

export type GroupSelectorProps = {
  groups: Array<{
    id: string;
    name: string;
    displayName: string;
    admins: string;
  }>
  onSelectGroup: Function;
} & RouteComponentProps;


type State = {
  currentGroupName: string;
}

class GroupSelector extends React.Component<GroupSelectorProps, State> {
  state = {
    currentGroupName: localStorage.getItem('currentGroupName') || undefined
  };

  handleChange = (groupName) => {
    const {history, match} = this.props;
    const subPath = get(match, 'params.subPath', 'home')
    history.push(`${appPrefix}g/${groupName}/${subPath}`);
  }

  componentDidMount() {
    this.syncCurrentGroupName();
  }

  componentDidUpdate(prevProps, prevState) {
    this.syncCurrentGroupName();
  }

  syncCurrentGroupName() {
    const {onSelectGroup, groups, match, history} = this.props;
    const {currentGroupName} = this.state;
    const matchGroupName = (match.params as any).groupName || null;

    if (groups && groups.length > 0) {
      if (matchGroupName && groups.find(group => group.name === matchGroupName)) {
        if (currentGroupName != matchGroupName) {
          this.setState({currentGroupName: matchGroupName});
          onSelectGroup(matchGroupName);
        }
      } else if (currentGroupName && groups.find(group => group.name === currentGroupName)) {
        history.push(`${appPrefix}g/${currentGroupName}/home`);
      } else {
        history.push(`${appPrefix}g/${groups[0].name}/home`);
      }
    } else if (groups) {
      if (matchGroupName) {
        history.push(`${appPrefix}g`);
      }
    }
  }

  render() {
    const {groups} = this.props;
    const {currentGroupName} = this.state;
    return (
      <div
        style={{ lineHeight: '64px'}}
      >
        <label style={{marginRight: '5px'}}>
          Group:
        </label>
        <Select size={'small'} value={groups && groups.length > 0 ? currentGroupName : "None"} disabled={!groups || groups.length <= 0} placeholder="Please select a group" onChange={this.handleChange} style={{width: "160px", fontSize: "12px"}}>
          {groups ? groups.map(group => (
            <Option key={group.id} value={group.name} title={group.displayName}>
              {group.displayName || group.name}
            </Option>
          )) : [] }
        </Select>
        <PHTooltip placement='bottom' tipText='Based on the specified working group, users are able to access corresponding resources and to perform features within the group accordingly.' tipLink='https://docs.primehub.io/docs/concept#groups' style={{marginLeft: '5px'}} />
      </div>
    )
  }
}

export default compose(
  withRouter
)(GroupSelector)
