import * as React from 'react';
import { compose } from 'recompose';
import { useHistory, withRouter, RouteComponentProps } from 'react-router-dom';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { errorHandler } from 'utils/errorHandler';
import { Icon, Modal, Table, Tag } from 'antd';
import { useState } from 'react';
import { find, isEmpty } from 'lodash';

const QUERY_SECRETS = gql`
  query {
    secrets {
      id
      name
      displayName
      type
    }
  }
`;

interface TSecret {
  id: string;
  name: string;
  displayName: string;
  type: string;
}

interface Props {
  initialValue;
  value;
  onChange;
  secretsQuery: {
    error: Error | undefined;
    loading: boolean;
    secrets?: TSecret[];
  };
}

interface State {
  secretId: string;
  selectedSecretId: string;
  modalVisible: boolean;
}

function _GitSecret(props: Props) {
  const { initialValue, secretsQuery } = props;
  const [state, setState] = useState<State>({
    modalVisible: false,
    secretId: initialValue?.id,
    selectedSecretId: initialValue?.id,
  });

  if (secretsQuery.error) {
    return <div>Failure to query secrets.</div>;
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
    },
    {
      key: 'displayName',
      title: 'Display Name',
      dataIndex: 'displayName',
    },
  ];

  let secretDisplayName;
  if (!secretsQuery.loading && state.secretId) {
    const secret = find(
      secretsQuery?.secrets,
      (s) => s.id === state.secretId
    );
    if (secret) {
      secretDisplayName = !isEmpty(secret.displayName) ? secret.displayName : secret.name;
    }
  }

  const notifyChange = (newState: State) => {
    const { onChange } = props;
    let updatedValue;
    setState(newState);

    if (initialValue?.id) {
      if (!newState.secretId) {
        updatedValue = {
          disconnect: true,
        };
      } else if (initialValue.id !== newState.secretId) {
        updatedValue = {
          connect: {
            id: newState.secretId,
          },
        };
      } else {
        updatedValue = {};
      }
    } else {
      if (!newState.secretId) {
        updatedValue = {};
      } else {
        updatedValue = {
          connect: {
            id: newState.secretId,
          },
        };
      }
    }
    console.log('onChange', initialValue, updatedValue);
    onChange(updatedValue);
  };

  const handleSelect = (selectedRowKeys) => {
    setState({
      ...state,
      selectedSecretId: selectedRowKeys[0],
    });
  };

  const handleRemove = () => {
    notifyChange({
      ...state,
      secretId: null,
      selectedSecretId: null,
      modalVisible: false,
    });
  };

  const handleModalOk = () => {
    notifyChange({
      ...state,
      secretId: state.selectedSecretId,
      modalVisible: false,
    });
  };

  const handleModalCancel = () => {
    notifyChange({
      ...state,
      selectedSecretId: state.secretId,
      modalVisible: false,
    });
  };

  return (
    <>
      <div>
        {!secretsQuery.loading && state.secretId && (
          <Tag closable onClose={handleRemove}>
            {secretDisplayName}
          </Tag>
        )}
        <Tag
          onClick={() => {
            setState({ ...state, modalVisible: true });
          }}
          style={{ background: '#fff', borderStyle: 'dashed' }}
        >
          <Icon
            type="plus"
          />{' '}
          Change
        </Tag>
      </div>
      <Modal width={800} visible={state.modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}>
        <div style={{marginTop:16}}>
          <Table
            size='small'
            rowKey={(data) => data.id}
            style={{ paddingTop: 8 }}
            columns={columns}
            // onChange={handleTableChange}
            dataSource={secretsQuery?.secrets}
            rowSelection={{
              type: 'radio',
              onChange: handleSelect,
              selectedRowKeys: state.selectedSecretId
                ? [state.selectedSecretId]
                : [],
            }}
          />
        </div>
      </Modal>

    </>
  );
}

export const GitSecret = compose(
  graphql(QUERY_SECRETS, {
    name: 'secretsQuery',
    options: () => {
      return {
        fetchPolicy: 'no-cache',
      };
    },
  })
)(_GitSecret);
