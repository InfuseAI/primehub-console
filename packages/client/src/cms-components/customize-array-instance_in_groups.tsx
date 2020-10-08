import React, { Component } from "react";
import { Table, Button, Skeleton } from "antd";
import { injectIntl } from "react-intl";
import {renderValue} from "@canner/antd-locales";
import gql from 'graphql-tag';
import {get} from 'lodash';
import {Props} from './types';

const GROUPS_WITH_INSTANCES = gql`
query ($groupWhere: GroupWhereInput, $everyoneGroupWhere: GroupWhereInput) {
  group: groupsConnection(where: $groupWhere) {
    edges {
      cursor
      node {
        instanceTypes {
          id
          displayName
          description
          cpuLimit
          memoryLimit
          gpuLimit
        }
      }
    }
  }

  everyoneGroup: groupsConnection(where: $everyoneGroupWhere) {
    edges {
      cursor
      node {
        instanceTypes {
          id
          displayName
          description
          cpuLimit
          memoryLimit
          gpuLimit
        }
      }
    }
  }
}
`

@injectIntl
export default class ArrayBreadcrumb extends Component<Props> {
  state = {
    fetched: false,
    value: []
  }

  componentDidMount() {
    const {client, routes, refId, routerParams} = this.props;
    const paths = refId.getPathArr();
    const [keyName, index, itName] = paths;
    if (routerParams.operator === 'create') {
      return this.setState({
        fetched: true,
      })
    }
    client.query({
      query: GROUPS_WITH_INSTANCES,
      variables: {
        groupWhere: {
          id: routes[1]
        },
        everyoneGroupWhere: {
          id: (window as any).everyoneGroupId
        }
      },
      fetchPolicy: 'network-only',
    }).then(result => {
      const group = get(result.data, ['group', 'edges', index, 'node', itName], []);
      const everyoneGroup = get(result.data, ['everyoneGroup', 'edges', '0', 'node', itName], []);
      const value = [...group, ...everyoneGroup];
      value.sort((a, b) => {
        if(a.displayName < b.displayName) return -1;
        if(a.displayName > b.displayName) return 1;
        return 0;
      })
      this.setState({
        value,
        fetched: true
      });
    })
  }

  render() {
    const {
      uiParams,
      showPagination,
      items,
      intl,
      goTo,
      reset,
      deploy,
      refId,
      onChange,
      routes
    } = this.props;
    const {fetched, value} = this.state;

    let dataSource = value;
    let {
      columns = [],
    } = uiParams;

    const newColumnsRender = renderValue(columns, items.items, {
      refId,
      deploy,
      reset,
      onChange,
      goTo,
      uiParams,
      intl
    });

    newColumnsRender.push({
      title: intl.formatMessage({ id: "array.table.actions" }),
      dataIndex: 'id',
      render: id => {
        return (
          <Button icon={"edit"}
            data-testid="edit-button"
            onClick={() => goTo({
              pathname: `instanceType/${id}`,
              payload: {
                backToGroup: routes[1]
              }
            })}
          />
        )
      }
    })

    if (!fetched) {
      return <Skeleton />
    }

    return (
      <div>
        <Table
          pagination={showPagination}
          dataSource={dataSource.map((datum, i) => {
            return {...datum, __index: i, key: datum.key || i};
          })}
          columns={newColumnsRender}
          style={{marginBottom: 32}}
          rowKey="id"
        />
      </div>
    );
  }
}
