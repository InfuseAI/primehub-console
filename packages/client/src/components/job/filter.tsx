import * as React from 'react';
import {Checkbox} from 'antd';
import styled from 'styled-components';
import GroupFilter, {Group} from 'components/job/groupFilter';

type Props = {
  groups: Group[];
};

const Title = styled.h3`
  margin-top: 36px;
`;

export default class Filter extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      selectedGroups: [],
      submittedByMe: false
    }
  }

  handleSubmittedByMeChange = e => {
    this.setState({
      submittedByMe: e.target.checked
    });
  }

  handleSelectedGroupsChange = (groupIds: string[]) => {
    console.log(groupIds);
    this.setState({selectedGroups: groupIds});
  }

  render() {
    const {groups} = this.props;
    return (
      <React.Fragment>
        <Title>
          Filter by Group
        </Title>
        <GroupFilter
          groups={groups}
          onChange={this.handleSelectedGroupsChange}
        />
        <Title>
          Filter by Submitted
        </Title>
        <Checkbox
          onChange={this.handleSubmittedByMeChange}
        >
          Submitted By Me
        </Checkbox>
      </React.Fragment>
    )
  }
}