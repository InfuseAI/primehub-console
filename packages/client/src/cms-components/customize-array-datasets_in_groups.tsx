import React, { Component } from "react";
import { Table, Button, Skeleton } from "antd";
import { injectIntl } from "react-intl";
import {renderValue} from "@canner/antd-locales";
import gql from 'graphql-tag';
import {get} from 'lodash';
import {Props} from './types';

const GROUPS_WITH_DATASETS = gql`
query ($groupFirst: Int, $groupWhere: GroupWhereInput) {
  group: groupsConnection(where: $groupWhere) {
    edges {
      cursor
      node {
        datasets {
          id
          displayName
          type
          description
          writable
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
    const [keyName, index, datasetName] = paths;
    if (routerParams.operator === 'create') {
      return this.setState({
        fetched: true,
      })
    }
    client.query({
      query: GROUPS_WITH_DATASETS,
      variables: {
        groupWhere: {
          id: routes[1]
        }
      },
      fetchPolicy: 'network-only',
    }).then(result => {
      const value = get(result.data, [keyName, 'edges', index, 'node', datasetName], []);
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
              pathname: `dataset/${id}`,
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
