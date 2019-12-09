import * as React from 'react';
import {Checkbox, Row, Col} from 'antd';
import {isEmpty} from 'lodash';

const CheckboxGroup = Checkbox.Group;

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
  indeterminate: boolean;
  selectAll: boolean
}

export default class GroupFilter extends React.Component<Props, State> {
  state = {
    indeterminate: false,
    selectAll: false
  };

  onChange = selectedGroups => {
    const {groups, onChange} = this.props;
    onChange(selectedGroups);
    this.setState({
      indeterminate: !!selectedGroups.length && selectedGroups.length < groups.length,
      selectAll: selectedGroups.length === groups.length
    });
  };

  onSelectAllChange = e => {
    const {groups, onChange} = this.props;
    const selectedGroups = e.target.checked ? groups.map(group => group.id) : [];
    onChange(selectedGroups);
    this.setState({
      indeterminate: false,
      selectAll: e.target.checked,
    });
  };

  render() {
    const {
      indeterminate,
      selectAll
    } = this.state;
    const {
      groups,
      selectedGroups
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
                  {isEmpty(group.displayName) ? group.name : group.displayName}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </CheckboxGroup>
      </div>
    )
  }
}