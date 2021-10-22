import React from 'react';
import {Card} from 'antd';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  max-width: 100%;
  text-align: center;
  margin-bottom: 5px;

  td {
    border-top: 1px solid #DDD;
  }

  tbody > tr.light-large-font {
    font-size: 24pt;
    font-weight: 100;
  }
`;

interface Props {
  groupContext: any;
  style: any;
}

class UserResourceMonitor extends React.Component<Props> {
  render() {
    const {groupContext, style} = this.props;
    return (
      <Card style={{overflow: 'auto', ...style}}>
        <h3>User Limits</h3>
        <Table>
          <tbody>
            <tr className='light-large-font'>
              <td>
                {groupContext.quotaCpu || '∞'}
              </td>
              <td>
                {groupContext.quotaMemory || '∞'}
              </td>
              <td>
                {groupContext.quotaGpu || '∞'}
              </td>
            </tr>
            <tr>
              <td><strong>CPU</strong></td>
              <td><strong>Memory</strong></td>
              <td><strong>GPU</strong></td>
            </tr>
          </tbody>
        </Table>
      </Card>
    );
  }
}

export default UserResourceMonitor;
