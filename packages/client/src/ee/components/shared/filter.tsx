import * as React from 'react';
import { Checkbox, Input, Col } from 'antd';
import GroupFilter, { Group } from 'ee/components/shared/groupFilter';
import { FilterRow, FilterPlugins, ButtonCol } from 'cms-toolbar/filter';
import { Label } from 'cms-toolbar/share';
import type { GroupContextValue } from 'context/group';

const Search = Input.Search;

type Props = {
  groupContext?: GroupContextValue;
  groups: Group[];
  selectedGroups: Array<string>;
  submittedByMe: boolean;
  labelSubmittedByMe?: string;
  resourceKey: string;
  searchHandler?: () => void;
  onChange: ({
    selectedGroups,
    submittedByMe,
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => void;
};

export default class Filter extends React.Component<Props> {
  handleSubmittedByMeChange = (e) => {
    const { onChange, selectedGroups } = this.props;
    onChange({
      submittedByMe: e.target.checked,
      selectedGroups,
    });
  };

  handleSelectedGroupsChange = (groupIds: string[]) => {
    const { onChange, submittedByMe } = this.props;
    onChange({
      submittedByMe,
      selectedGroups: groupIds,
    });
  };

  render() {
    const {
      groupContext,
      groups,
      selectedGroups,
      submittedByMe,
      labelSubmittedByMe,
      searchHandler,
      resourceKey,
    } = this.props;

    const filterComps = [];
    if (!groupContext) {
      // Not in group context
      filterComps.push(
        <Col key="no-group-ctx" style={{ flex: 1 }}>
          <FilterPlugins style={{ marginRight: 0 }}>
            <Label>Group</Label>
            <GroupFilter
              groups={groups}
              selectedGroups={selectedGroups}
              onChange={this.handleSelectedGroupsChange}
            />
          </FilterPlugins>
        </Col>
      );
      filterComps.push(
        <div
          key="divider"
          style={{
            borderLeft: '1px solid #d9d9d9',
            margin: '0px 8px 2px',
            height: 28,
          }}
        />
      );
    } else if (searchHandler) {
      filterComps.push(
        <Col key="search-handler" style={{ flex: 1 }}>
          <FilterPlugins style={{ marginRight: '10px' }}>
            <Search
              placeholder={`Search ${resourceKey} name`}
              onSearch={searchHandler}
            />
          </FilterPlugins>
        </Col>
      );
    } else {
      filterComps.push(<Col key="basic-col" style={{ flex: 1 }} />);
    }

    return (
      <FilterRow
        type="flex"
        justify="space-between"
        align="bottom"
        style={{ marginBottom: 16, marginTop: 16 }}
      >
        {...filterComps}
        <ButtonCol>
          <Checkbox
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: '4.5px 8px',
            }}
            checked={submittedByMe}
            onChange={this.handleSubmittedByMeChange}
          >
            {labelSubmittedByMe || 'Submitted By Me'}
          </Checkbox>
        </ButtonCol>
      </FilterRow>
    );
  }
}
