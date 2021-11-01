import * as React from 'react';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { Icon, Modal, Table, Tag } from 'antd';
import { useState } from 'react';
import { find, isEmpty } from 'lodash';
import { GetSecrets } from 'queries/Volumes.graphql';
import { TruncateTableField } from 'utils/TruncateTableField';

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
  gitSecretsQuery: {
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
  const { initialValue, gitSecretsQuery } = props;
  const [state, setState] = useState<State>({
    modalVisible: false,
    secretId: initialValue?.id,
    selectedSecretId: initialValue?.id,
  });

  if (gitSecretsQuery.error) {
    return <div>Failure to query secrets.</div>;
  }

  const columns = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      render: text => <TruncateTableField text={text} />,
    },
    {
      key: 'displayName',
      title: 'Display Name',
      dataIndex: 'displayName',
      render: text => <TruncateTableField text={text} />,
    },
  ];

  let secretDisplayName;
  if (!gitSecretsQuery.loading && state.secretId) {
    const secret = find(gitSecretsQuery?.secrets, s => s.id === state.secretId);
    if (secret) {
      secretDisplayName = !isEmpty(secret.displayName)
        ? secret.displayName
        : secret.name;
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
    onChange(updatedValue);
  };

  const handleSelect = selectedRowKeys => {
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
        {!gitSecretsQuery.loading && state.secretId && (
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
          <Icon type='edit' /> Change
        </Tag>
      </div>
      <Modal
        width={800}
        visible={state.modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <div style={{ marginTop: 16 }}>
          <Table
            size='small'
            rowKey={data => data.id}
            style={{ paddingTop: 8 }}
            columns={columns}
            dataSource={gitSecretsQuery?.secrets}
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
  graphql(GetSecrets, {
    name: 'gitSecretsQuery',
    options: () => {
      return {
        fetchPolicy: 'network-only',
      };
    },
  })
)(_GitSecret);
