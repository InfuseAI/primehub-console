import * as React from 'react';
import {Checkbox, Col, Divider} from 'antd';
import styled from 'styled-components';
import GroupFilter, {Group} from 'ee/components/shared/groupFilter';
import {FilterRow, FilterPlugins, ButtonCol} from 'root/cms-toolbar/filter';
import {Label} from 'root/cms-toolbar/share';

type Props = {
  groups: Group[];
  selectedGroups: Array<string>;
  submittedByMe: boolean;
  labelSubmittedByMe: string;
  onChange: ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => void;
};

const Title = styled.h3`
  margin-top: 36px;
`;

export default class Filter extends React.Component<Props> {
  handleSubmittedByMeChange = e => {
    const {onChange, selectedGroups} = this.props
    onChange({
      submittedByMe: e.target.checked,
      selectedGroups
    });
  }

  handleSelectedGroupsChange = (groupIds: string[]) => {
    const {onChange, submittedByMe} = this.props
    onChange({
      submittedByMe,
      selectedGroups: groupIds
    });
  }

  render() {
    const {groups, selectedGroups, submittedByMe, labelSubmittedByMe} = this.props;
    return (
      <FilterRow type="flex" justify="space-between" align="bottom" style={{marginBottom: 16, marginTop: 16}}>
        <Col style={{flex: 1}}>
          <FilterPlugins style={{marginRight: 0}}>
            <Label>Group</Label>
            <GroupFilter
              groups={groups}
              selectedGroups={selectedGroups}
              onChange={this.handleSelectedGroupsChange}
            />
          </FilterPlugins>
        </Col>
        <div style={{borderLeft: '1px solid #d9d9d9', margin: '0px 8px 2px', height: 28}} />
        <ButtonCol>
          <Checkbox
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: '4px 8px'
            }}
            checked={submittedByMe}
            onChange={this.handleSubmittedByMeChange}
          >
            { labelSubmittedByMe || "Submitted By Me" }
          </Checkbox>
        </ButtonCol>
      </FilterRow>
    )
  }
}
