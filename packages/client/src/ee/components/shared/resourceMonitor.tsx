import * as React from 'react';
import { Card } from 'antd';
import { get, unionBy } from 'lodash';
import styled from 'styled-components';

interface Props {
  groupContext: any;
  refetchGroup: () => void;
  showDeployment?: boolean;
  showDataset?: boolean;
  globalDatasets?: Array<Record<string, any>>;
  selectedGroup: string;
  style: any;
}

interface State {
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

export default class ResourceMonitor extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      groupContext: null
    };
  }

  componentDidMount() {
    this.fetchGroup(this.props.selectedGroup);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.selectedGroup !== this.props.selectedGroup) {
      this.fetchGroup(this.props.selectedGroup);
    }
  }

  fetchGroup = async groupId => {
    if (groupId) {
      const { refetchGroup, groupContext } = this.props;
      const everyoneGroupId = window.EVERYONE_GROUP_ID;
      const fetchedResult = await refetchGroup();
      const allGroups = get(fetchedResult, 'data.me.groups', []);
      const groups = allGroups
        .filter(group => group.id !== everyoneGroupId)
        .filter(group => !groupContext || groupContext.id === group.id);
      const group = groups.find(group => group.id === groupId);
      this.setState({ groupContext: group });
    }
  }

  render() {
    const { showDeployment, showDataset, globalDatasets, style } = this.props;
    const { groupContext } = this.state;
    if (groupContext) {
      const datasets = unionBy(
        get(groupContext, 'datasets', []),
        globalDatasets
      );
      return (
        <>
          <Card style={{ overflow: 'auto', ...style }}>
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
                  <td>{groupContext.projectQuotaCpu == null ? '∞' : groupContext.projectQuotaCpu}</td>
                </tr>
                <tr>
                  <td>Memory</td>
                  <td>{groupContext.resourceStatus.memUsage} GB</td>
                  <td>{groupContext.projectQuotaMemory == null ? '∞' : `${groupContext.projectQuotaMemory} GB`} </td>
                </tr>
                <tr>
                  <td>GPU</td>
                  <td>{groupContext.resourceStatus.gpuUsage}</td>
                  <td>{groupContext.projectQuotaGpu == null ? '∞' : groupContext.projectQuotaGpu}</td>
                </tr>
                {showDeployment && (
                  <tr>
                    <td>Deployments</td>
                    <td>{groupContext.deploymentsUsage}</td>
                    <td>{groupContext.maxDeploy == null ? '∞' : groupContext.maxDeploy}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
          {showDataset && (
            <Card style={{ overflow: 'auto' }}>
              <h3>Volumes</h3>
              {datasets.length ? (
                <ul style={{ marginLeft: '20px' }}>
                  {datasets.map(dataset => (<li>{get(dataset, 'displayName')}</li>))}
                </ul>
              ) : (
                <div> No available volume </div>
              )}
            </Card>
          )}
        </>
      );
    }
    return <Card loading={true} style={{ overflow: 'auto' }}></Card>
  }
}
