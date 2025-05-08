import * as React from 'react';
import { compose } from 'recompose';
import { useHistory, withRouter, RouteComponentProps } from 'react-router-dom';
import { graphql } from 'react-apollo';
import { notification } from 'antd';
import { omit } from 'lodash';

import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';

import { InstanceTypesLayout } from './Layout';
import { InstanceTypeForm, InstanceTypeFormState } from './InstanceTypeForm';
import {
  InstanceTypeInfoQuery,
  UpdateInstanceTypeMutation,
} from './instanceTypes.graphql';
import type { TInstanceType } from './types';

interface Props {
  data: {
    error: Error | undefined;
    loading: boolean;
    instanceType?: TInstanceType;
  };
  updateInstanceTypeMutation: ({
    variables,
  }: {
    variables: {
      payload: InstanceTypeFormState;
      where: Pick<InstanceTypeFormState, 'id'>;
    };
  }) => Promise<void>;
}

function _InstanceTypeInfo({ data, ...props }: Props) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  async function onSubmit(
    formData: InstanceTypeFormState & { nodeList?: string[][] }
  ) {
    const { id, tolerations, gpuLimit, gpuResourceName, ...rest } = formData;

    const nextTolerations =
      tolerations.length === 0
        ? []
        : tolerations.map(toleration => omit(toleration, ['id', '__typename']));

    let nextNodeSelector: Record<string, string> = {};
    if (formData?.nodeList) {
      nextNodeSelector = formData.nodeList.reduce((acc, v) => {
        const key = v[0];
        const value = v[1];

        acc[key] = value;

        return acc;
      }, {});
    }

    for (const field of ['displayName', 'description']) {
      rest[field] = rest[field].trim();
    }

    try {
      await props.updateInstanceTypeMutation({
        variables: {
          payload: {
            ...omit(rest, [
              'id',
              'nodeList',
              'tolerations',
              'toleration-key', // for create/edit toleration used
              'toleration-value', // for create/edit toleration used
            ]),
            tolerations: {
              // @ts-ignore Due to API have a `set` field
              set: nextTolerations,
            },
            nodeSelector: nextNodeSelector,
            gpuLimit: gpuLimit,
            gpuResourceName: gpuLimit > 0 ? gpuResourceName : '',
          },
          where: {
            id,
          },
        },
      });

      history.push(`${appPrefix}admin/instanceType`);

      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Save successfully!',
        description: 'Your changes have been saved.',
      });
    } catch (err) {
      console.error(err);
      errorHandler(err);
    }
  }

  return (
    <InstanceTypesLayout>
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <InstanceTypeForm
          disableName
          data={data?.instanceType}
          loading={data.loading}
          onSubmit={onSubmit}
        />
      </div>
    </InstanceTypesLayout>
  );
}

export const InstanceTypeInfo = compose(
  withRouter,
  graphql(InstanceTypeInfoQuery, {
    options: ({ match }: RouteComponentProps<{ id: string }>) => {
      const { id } = match.params;

      return {
        variables: {
          where: {
            id,
          },
        },
        fetchPolicy: 'cache-and-network',
        onError: errorHandler,
      };
    },
  }),
  graphql(UpdateInstanceTypeMutation, {
    name: 'updateInstanceTypeMutation',
  })
)(_InstanceTypeInfo);
