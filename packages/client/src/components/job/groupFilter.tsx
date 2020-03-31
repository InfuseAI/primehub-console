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
        {sortItems(groups).map(group => (
          <Select.Option key={group.id} value={group.id}>
            {group.displayName || group.name}
          </Select.Option>
        ))}
      </Select>
    )
  }
}
