import * as React from 'react';
import { Checkbox, Row, Col } from 'antd';

const CheckboxGroup = Checkbox.Group;

export type Group = {
  id: string;
  displayName: string;
}

type Props = {
  groups: Group[];
  onChange: (groupIds: string[]) => void;
}

type State = {
  indeterminate: boolean;
  selectAll: boolean;
  selectedGroups: string[];
}

export default class GroupFilter extends React.Component<Props, State> {
  state = {
    indeterminate: false,
    selectAll: false,
    selectedGroups: []
  };

  onChange = selectedGroups => {
    const {groups, onChange} = this.props;
    onChange(selectedGroups);
    this.setState({
      indeterminate: !!selectedGroups.length && selectedGroups.length < groups.length,
      selectAll: selectedGroups.length === groups.length,
      selectedGroups
    });
  };

  onSelectAllChange = e => {
    const {groups, onChange} = this.props;
    const selectedGroups = e.target.checked ? groups.map(group => group.id) : [];
    onChange(selectedGroups);
    this.setState({
      selectedGroups,
      indeterminate: false,
      selectAll: e.target.checked,
    });
  };

  render() {
    const {
      indeterminate,
      selectAll,
      selectedGroups,
    } = this.state;
    const {
      groups
    } = this.props;
    return (
      <div>
        <div style={{ borderBottom: '1px solid #E9E9E9' }}>
          <Checkbox
            indeterminate={indeterminate}
            onChange={this.onSelectAllChange}
            checked={selectAll}
          >
            Select all
          </Checkbox>
        </div>
        <br />
        <CheckboxGroup
          value={selectedGroups}
          onChange={this.onChange}
        >
          <Row>
            {groups.map(group => (
              <Col key={group.id} span={12}>
                <Checkbox value={group.id}>
                  {group.displayName}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </CheckboxGroup>
      </div>
    )
  }
}