import React, { PureComponent, useState } from 'react';
import { compose } from 'recompose';
import { Icon, Table, Button } from 'antd';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { difference } from 'lodash';
import RelationPicker from '../share/RelationPicker';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { TDatasetFormGroups, TDatasetGroups } from './types';
import { Link } from 'react-router-dom';

const QUERY_GROUPS = gql`
  query QueryGroups($page: Int, $where: GroupWhereInput, $orderBy: GroupOrderByInput) {
    groups: groupsConnection(page: $page, where: $where, orderBy: $orderBy) {
      edges {
        cursor
        node {
          id
          name
          displayName
        }
      }
      pageInfo {
        currentPage
        totalPage
      }
    }
  }
`;

const Title = styled.div`
  color: rgba(0, 0, 0, 0.85);
  padding: 0px 0px 8px;
`;

interface Props {
  groups: TDatasetGroups;
  value: TDatasetFormGroups;
  onChange: (TDatasetFormGroups) => void;
  allowWritable: boolean;
  groupsQuery: {
    error: Error | undefined;
    loading: boolean;
    groups?: any;
    refetch;
  };
}

function _DatasetGroupsRelationTable(props: Props) {
  const {groups,allowWritable = true, groupsQuery, onChange} = props;

  const [modalVisible, setModalVisible] = useState(false);
  const [writable, setWritable] = useState(false);
  const [updatedGroups, setUpdatedGroups]  = useState(groups);

  const showModal = ({writable}: {writable: boolean}) => {
    setWritable(writable);
    setModalVisible(true);
  };

  const handleOk = (idsSelected) => {
    const idsBefore = writable ?
      updatedGroups.filter(item => item.writable).map(v => v.id) :
      updatedGroups.filter(item => !item.writable).map(v => v.id);
    const idsAdded = difference(idsSelected, idsBefore);
    const idsRemove = difference(idsBefore, idsSelected);
    const newUpdatedGroups = [
      ...(updatedGroups
        .filter(item => !idsRemove.find(id => item.id === id))
        .map(item => idsAdded.find(id => item.id === id) ?
          {...item,writable} :
          item
        )),
      ...(idsAdded
        .filter(id => !updatedGroups.find(item => item.id === id ))
        .map(id => groupsQuery.groups.edges.find(item => item.node.id === id))
        .map(item => ({...(item.node), writable}))),
    ];


    const newValue = {
      connect: newUpdatedGroups
        .flatMap(newItem => {
          const oldItem = groups.find(oldItem => oldItem.id === newItem.id);
          if (!oldItem) {
            return [{id: newItem.id, writable: newItem.writable}];
          } else if (oldItem.writable !== newItem.writable) {
            return [{id: newItem.id, writable: newItem.writable}];
          } else {
            return [];
          }
        }),
      disconnect: groups
        .flatMap(oldItem => {
          const newItem = newUpdatedGroups.find(newItem => oldItem.id === newItem.id);
          if (!newItem) {
            return [{id: oldItem.id}];
          } else {
            return [];
          }
        }),
    };

    setUpdatedGroups(newUpdatedGroups);
    onChange(newValue);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (text, record) => {
        return <Link to={`../group/${record.id}`}>{text}</Link>;
      },
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
    },
  ];

  const readOnlyGroups = updatedGroups.filter(item => !item.writable);
  const writableGroups = updatedGroups.filter(item => item.writable);
  const pickIds = !writable ? readOnlyGroups.map(v => v.id) : writableGroups.map(v => v.id)

  return (
    <div>
      <Title>
        <FormattedMessage
          id="readOnlyGroups"
          defaultMessage="Readonly Groups"
        />
      </Title>
      <div>
        <Button data-testid="connect-button" onClick={() => showModal({writable: false})} style={{margin: '16px 8px 16px 0'}}>
          <Icon type="link"/>
          <FormattedMessage
            id="relation.multipleSelect.connect"
            defaultMessage="edit "
          />
          <span style={{marginLeft: 4, textTransform: 'capitalize'}}>
            Groups
          </span>
        </Button>
      </div>
      <Table
        dataSource={readOnlyGroups}
        columns={columns}
        size="small"
        style={{marginBottom: 16}}
      />
      {groupsQuery.groups && <RelationPicker
            visible={modalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            pickedIds={pickIds}
            columns={columns}
            relationValue={groupsQuery.groups}
            title={"Groups"}
            updateRelationQuery={groupsQuery.refetch}
            loading={groupsQuery?.loading}
          />}

      {
        allowWritable && (
          <>
            <Title>
              <FormattedMessage
                id="writableGroups"
                defaultMessage="Writable Groups"
              />
            </Title>
            <div>
              <Button onClick={() => showModal({writable: true})} style={{margin: '16px 8px 16px 0'}}>
                <Icon type="link"/>
                <FormattedMessage
                  id="relation.multipleSelect.connect"
                  defaultMessage="edit "
                />
                <span style={{marginLeft: 4, textTransform: 'capitalize'}}>Writable Groups</span>
              </Button>
            </div>
            <Table
              dataSource={writableGroups}
              columns={columns}
              style={{marginBottom: 16}}
              size="small"
            />
          </>
        )
      }
    </div>
  );
}


export const DatasetGroupsRelationTable = compose(
  graphql(QUERY_GROUPS, {
    name: 'groupsQuery',
    options: () => {
      return {
        fetchPolicy: 'no-cache',
      };
    },
  })
)(_DatasetGroupsRelationTable);
