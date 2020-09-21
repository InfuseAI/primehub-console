import * as React from 'react';
import {Spin, Card, Divider} from 'antd';
import {get} from 'lodash';
import styled from 'styled-components'

type Props = {
  groupContext: any;
  refetchGroup: Function;
  showDataset: Boolean;
  selectedGroup: String;
}

type State = {
  groupContext: any;
}

const Table = styled.table`
  width: 100%;
  td, th {
    line-height: 2.5em;
    padding-left: 5px;
  }

  th {
    border-bottom: 2px solid #AAA;
  }

  td {
    border-bottom: 1px solid #DDD;
  }

  tbody > tr:nth-child(odd) {
    background-color: #FAFAFA;
  }

  tr > td:first-child {
    font-weight: bold;
  }
`;

export default class ResrouceMonitor extends React.Component<Props, State> {
  constructor (props) {
    super(props);
    this.state = {
      groupContext: null
    }
  }

  componentDidMount() {
    this.fetchGroup(this.props.selectedGroup);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.selectedGroup !== this.props.selectedGroup) {
      this.fetchGroup(this.props.selectedGroup);
    }
  }

  fetchGroup = async (groupId) => {
    if (groupId) {
      const { refetchGroup, groupContext } = this.props;
      const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
      const fetchedResult = await refetchGroup();
      const allGroups = get(fetchedResult, 'data.me.groups', []);
      const groups = allGroups
        .filter(group => group.id !== everyoneGroupId)
        .filter(group => !groupContext || groupContext.id === group.id );
      const group = groups
        .find(group => group.id === groupId);
      this.setState({groupContext: group});
    }
  }

  render() {
    const { showDataset } = this.props;
    const { groupContext } = this.state;
    if (groupContext) {
      return (
        <>
            <Card style={{overflow: 'auto'}}>
              <h3>Group Resource</h3>
              <Table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Used</th>
                    <th>Limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CPU</td>
                    <td>{groupContext.resourceStatus.cpuUsage}</td>
                    <td>{groupContext.quotaCpu == null ? '∞' : groupContext.quotaCpu}</td>
                  </tr>
                  <tr>
                    <td>Memory</td>
                    <td>{groupContext.resourceStatus.memUsage} GB</td>
                    <td>{groupContext.quotaMemory == null ? '∞' : `${groupContext.quotaMemory} GB`} </td>
                  </tr>
                  <tr>
                    <td>GPU</td>
                    <td>{groupContext.resourceStatus.gpuUsage} </td>
                    <td>{groupContext.quotaGpu == null ? '∞' : groupContext.quotaGpu}</td>
                  </tr>
                </tbody>
              </Table>
            </Card>
            {
              (showDataset) ? (
                <Card style={{overflow: 'auto'}}>
                  <h3>Datasets</h3>
                  {
                    groupContext.datasets.length ? (
                    <ul>
                      {
                        groupContext.datasets.map(dataset =>(<li>{dataset.displayName}</li>))
                      }
                    </ul>
                    ) : (
                      <div> No available dataset </div>
                    )
                  }
                </Card>
              ) : (
                <></>
              )
            }
        </>
      );
    }
    return <Card style={{overflow: 'auto'}}><Spin></Spin></Card>
  }
}
