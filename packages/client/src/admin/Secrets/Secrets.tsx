import * as React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { Button, Table, Icon, Modal, notification } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import { useForm } from 'react-hook-form';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import {
  GetSecrets,
  CreateSecretMutation,
  DeleteSecretMutation,
} from './secrets.graphql';
import { SecretLayout } from './Layout';
import { SecretForm, initialFormState } from './SecretForm';
import type { TSecret, SecretType } from './types';

const styles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  margin: '16px',
  padding: '32px',
  backgroundColor: '#fff',
};

type SecretNode = {
  cursor: string;
  node: Pick<TSecret, 'id' | 'name' | 'displayName' | 'type'>;
};

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
      payload: Partial<TSecret>;
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
  const { appPrefix } = useRoutePrefix();
  const history = useHistory();
  const location = useLocation();
  const querystring = new URLSearchParams(location.search);

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
              <Link to={`${appPrefix}admin/secret/${secret.node.id}`}>
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
                    try {
                      await deleteSecretMutation({
                        variables: {
                          where: {
                            id: secret.node.id,
                          },
                        },
                      });
                      await secretQuery.refetch();
                    } catch (err) {
                      console.error(err);
                      notification.error({
                        duration: 5,
                        placement: 'bottomRight',
                        message: 'Failure',
                        description: 'Failure to delete, try again later.',
                      });
                    }
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

      formMethods.reset();
      history.push(`${appPrefix}admin/secret`);

      await secretQuery.refetch();
      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Save successfully!',
        description: (
          <>
            Your changes have been saved. Click{' '}
            <span
              style={{ color: '#365abd', cursor: 'pointer' }}
              onClick={() => history.push(`${appPrefix}admin/secret/${id}`)}
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

  if (querystring && querystring.get('operator') === 'create') {
    return (
      <SecretLayout>
        <div style={styles}>
          <SecretForm {...formMethods} onSubmit={onSubmit} />
        </div>
      </SecretLayout>
    );
  }

  return (
    <>
      <SecretLayout>
        <div style={styles}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon="plus"
              // @ts-ignore
              disabled={secretQuery.loading}
              onClick={() =>
                history.push(`${appPrefix}admin/secret?operator=create`)
              }
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
