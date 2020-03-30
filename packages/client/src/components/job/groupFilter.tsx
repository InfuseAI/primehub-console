import * as React from 'react';
import {Select} from 'antd';

export type Group = {
  id: string;
  displayName: string;
  name: string;
}

type Props = {
  groups: Group[];
  selectedGroups: Array<string>;
  onChange: (groupIds: string[]) => void;
}

type State = {
}

export default class GroupFilter extends React.Component<Props, State> {


  onChange = selectedGroups => {
    const {groups, onChange} = this.props;
    onChange(selectedGroups);
  };

  render() {
    const {
      groups,
      selectedGroups
    } = this.props;
    return (
      <Select
        value={selectedGroups}
        onChange={this.onChange}
        style={{width: '100%'}}
        mode="multiple"
      >
        {groups.map(group => (
          <Select.Option key={group.id} value={group.id}>
            {group.displayName || group.name}
          </Select.Option>
        ))}
      </Select>
    )
  }
}