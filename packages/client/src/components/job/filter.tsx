import * as React from 'react';
import {Checkbox} from 'antd';
import styled from 'styled-components';
import GroupFilter, {Group} from 'components/job/groupFilter';

type Props = {
  groups: Group[];
  onChange: ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => void;
};

type State = {
  selectedGroups: Array<string>;
  submittedByMe: boolean;
}

const Title = styled.h3`
  margin-top: 36px;
`;

export default class Filter extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      selectedGroups: [],
      submittedByMe: false
    }
  }

  handleSubmittedByMeChange = e => {
    const {onChange} = this.props
    this.setState({
      submittedByMe: e.target.checked
    }, () => {
      onChange(this.state);
    });
  }

  handleSelectedGroupsChange = (groupIds: string[]) => {
    const {onChange} = this.props
    this.setState({selectedGroups: groupIds}, () => {
      onChange(this.state);
    });
  }

  render() {
    const {groups} = this.props;
    return (
      <React.Fragment>
        <Title>
          Filter by Group
        </Title>
        {
          groups.length && (
            <GroupFilter
              groups={groups}
              onChange={this.handleSelectedGroupsChange}
            />
          ) 
        }
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