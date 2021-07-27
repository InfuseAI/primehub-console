import * as React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Button, Table, Icon, Modal, notification } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { useForm } from 'react-hook-form';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import {
  GetSecrets,
  CreateSecretMutation,
  DeleteSecretMutation,
} from './secrets.graphql';
import { SecretLayout } from './Layout';
import { SecretForm, initialFormState } from './SecretForm';
import type { Secret, SecretType } from './types';

interface SecretNode {
  cursor: string;
  node: Pick<Secret, 'id' | 'name' | 'displayName' | 'type'>;
}

interface Props {
  secretQuery: {
    refetch: () => Promise<void>;
    error: Error | undefined;
    loading: boolean;
    secretsConnection?: {
      edges: SecretNode[];
    };
  };
  createSecretMutation: ({
    variables,
  }: {
    variables: {
      payload: Partial<Secret>;
    };
  }) => Promise<{ data: { createSecret: { id: string } } }>;
  deleteSecretMutation: ({
    variables,
  }: {
    variables: {
      where: {
        id: string;
      };
    };
  }) => Promise<void>;
}

function _Secrets({
  secretQuery,
  createSecretMutation,
  deleteSecretMutation,
}: Props) {
  const [visible, setVisible] = React.useState(false);
  const history = useHistory();
  const formMethods = useForm({
    mode: 'onChange',
    defaultValues: {
      ...initialFormState,
      type: 'opaque' as SecretType,
    },
  });
  const columns: ColumnProps<SecretNode>[] = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'node.name',
    },
    {
      key: 'display-name',
      title: 'Display Name',
      dataIndex: 'node.displayName',
    },
    {
      key: 'type',
      title: 'Type',
      render: function RenderType(secret: SecretNode) {
        const secretName = {
          opaque: 'Git Dataset',
          kubernetes: 'Image Pull',
        };

        return secretName[secret.node.type];
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '200px',
      render: function RenderActions(secret: SecretNode) {
        return (
          <Button.Group>
            <Button>
              <Link to={`/admin/secret/${secret.node.id}`}>
                <Icon type="edit" />
              </Link>
            </Button>
            <Button
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Secret',
                  content: (
                    <>
                      Are you sure to delete{' '}
                      <strong>{secret.node.displayName}</strong> secret?
                    </>
                  ),
                  okText: 'Yes',
                  onOk: async () => {
                    await deleteSecretMutation({
                      variables: {
                        where: {
                          id: secret.node.id,
                        },
                      },
                    });
                    await secretQuery.refetch();
                  },
                });
              }}
            >
              <Icon type="delete" />
            </Button>
          </Button.Group>
        );
      },
    },
  ];

  async function onSubmit() {
    const { name, displayName, ...values } = formMethods.getValues();

    const payloads = {
      opaque: {
        secret: values.secret,
      },
      kubernetes: {
        registryHost: values.registryHost,
        username: values.username,
        password: values.password,
      },
    };

    try {
      const {
        data: {
          createSecret: { id },
        },
      } = await createSecretMutation({
        variables: {
          payload: {
            name,
            displayName,
            type: values.type,
            ...payloads[values.type],
          },
        },
      });

      await secretQuery.refetch();
      setVisible(false);
      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Save successfully!',
        description: (
          <>
            Your changes have been saved. Click{' '}
            <span
              style={{ color: '#365abd', cursor: 'pointer' }}
              onClick={() => history.push(`/admin/secret/${id}`)}
            >
              here
            </span>{' '}
            to edit.
          </>
        ),
      });
    } catch (err) {
      console.error(err);
      notification.error({
        duration: 5,
        placement: 'bottomRight',
        message: 'Failure',
        description: 'Failure to update, try again later.',
      });
    }
  }

  if (secretQuery.error) {
    return <div>Failure to load secrets.</div>;
  }

  return (
    <>
      <SecretLayout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            margin: '16px',
            padding: '32px',
            backgroundColor: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon="plus"
              // @ts-ignore
              disabled={secretQuery.loading}
              onClick={() => setVisible(true)}
            >
              Add
            </Button>
          </div>
          <Table
            rowKey={(data) => data.node.id}
            style={{ paddingTop: 8 }}
            columns={columns}
            loading={secretQuery.loading}
            dataSource={secretQuery?.secretsConnection?.edges}
          />
        </div>

        <Modal
          title="Create A Secret"
          visible={visible}
          footer={[
            <Button key="cancel" onClick={() => setVisible(false)}>
              Cancel
            </Button>,
            // @ts-ignore
            <Button
              key="create"
              type="primary"
              loading={secretQuery.loading}
              onClick={onSubmit}
            >
              Create
            </Button>,
          ]}
        >
          <SecretForm {...formMethods} />
        </Modal>
      </SecretLayout>
    </>
  );
}

export const Secrets = compose(
  graphql(GetSecrets, {
    name: 'secretQuery',
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
      };
    },
  }),
  graphql(CreateSecretMutation, {
    name: 'createSecretMutation',
  }),
  graphql(DeleteSecretMutation, {
    name: 'deleteSecretMutation',
  })
)(_Secrets);
