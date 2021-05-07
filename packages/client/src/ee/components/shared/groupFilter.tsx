import * as React from 'react';
import {Select} from 'antd';
import {sortNameByAlphaBet} from 'utils/sorting';

export interface Group {
  id: string;
  displayName: string;
  name: string;
}

interface Props {
  groups: Group[];
  selectedGroups: string[];
  onChange: (groupIds: string[]) => void;
}

export default class GroupFilter extends React.Component<Props> {
  onChange = selectedGroups => {
    const {onChange} = this.props;
    onChange(selectedGroups);
  }

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
        mode='multiple'
      >
        {sortNameByAlphaBet(groups).map(group => (
          <Select.Option key={group.id} value={group.id}>
            {group.displayName || group.name}
          </Select.Option>
        ))}
      </Select>
    );
  }
}
