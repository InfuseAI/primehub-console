import * as React from 'react';
import {Checkbox} from 'antd';
import styled from 'styled-components';
import GroupFilter, {Group} from 'components/job/groupFilter';

type Props = {
  groups: Group[];
  selectedGroups: Array<string>;
  submittedByMe: boolean;
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
    const {groups, selectedGroups, submittedByMe} = this.props;
    return (
      <React.Fragment>
        <Title>
          Filter by Group
        </Title>
        <GroupFilter
          groups={groups}
          selectedGroups={selectedGroups}
          onChange={this.handleSelectedGroupsChange}
        />
        <Title>
          Filter by Submitted
        </Title>
        <Checkbox
          checked={submittedByMe}
          onChange={this.handleSubmittedByMeChange}
        >
          Submitted By Me
        </Checkbox>
      </React.Fragment>
    )
  }
}