import * as React from 'react';
import { compose } from 'recompose';
import { useHistory, withRouter, RouteComponentProps } from 'react-router-dom';
import { notification } from 'antd';
import { useForm } from 'react-hook-form';
import { graphql } from 'react-apollo';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import { SecretLayout } from './Layout';
import { SecretForm, initialFormState } from './SecretForm';
import { SecretQuery, UpdateSecretMutation } from './secrets.graphql';
import type { TSecret } from './types';

interface Props {
  secretQuery: {
    error: Error | undefined;
    loading: boolean;
    secret?: TSecret;
  };
  updateSecretMutation: ({
    variables,
  }: {
    variables: {
      payload: Partial<TSecret>;
      where: Pick<TSecret, 'id'>;
    };
  }) => Promise<void>;
}

function _SecretInfo({ secretQuery, updateSecretMutation }: Props) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();
  const { reset, ...formMethods } = useForm({
    defaultValues: initialFormState,
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (secretQuery?.secret) {
      const { id, name, displayName, type, registryHost, username, password } =
        secretQuery.secret;

      reset({
        id,
        name,
        displayName,
        type,
        registryHost,
        username,
        password,
      });
    }
  }, [secretQuery, reset]);

  if (secretQuery.error) {
    return <div>Failure to load secrets.</div>;
  }

  async function onSubmit(data: typeof initialFormState) {
    const payloads = {
      opaque: {
        secret: data.secret,
      },
      kubernetes: {
        registryHost: data.registryHost,
        username: data.username,
        password: data.password,
      },
    };

    try {
      await updateSecretMutation({
        variables: {
          payload: {
            displayName: data.displayName,
            type: data.type,
            ...payloads[data.type],
          },
          where: {
            id: data.id,
          },
        },
      });

      history.push(`${appPrefix}admin/secret`);
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

  return (
    <SecretLayout>
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <SecretForm {...formMethods} disabledName onSubmit={onSubmit} />
      </div>
    </SecretLayout>
  );
}

export const SecretInfo = compose(
  withRouter,
  graphql(SecretQuery, {
    name: 'secretQuery',
    options: ({ match }: RouteComponentProps<{ id: string }>) => {
      const secretId = match.params.id;

      return {
        variables: {
          where: {
            id: secretId,
          },
        },
      };
    },
  }),
  graphql(UpdateSecretMutation, {
    name: 'updateSecretMutation',
  })
)(_SecretInfo);
