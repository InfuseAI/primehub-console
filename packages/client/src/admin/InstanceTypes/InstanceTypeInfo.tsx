import * as React from 'react';
import { compose } from 'recompose';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { graphql } from 'react-apollo';
import { notification } from 'antd';

import { InstanceTypesLayout } from './Layout';
import { InstanceTypeForm, initialFormState } from './InstanceTypeForm';
import { InstanceTypeInfoQuery } from './instanceTypes.graphql';
import type { TInstanceType } from './types';

interface Props {
  data: {
    error: Error | undefined;
    loading: boolean;
    instanceType?: TInstanceType;
  };
}

function _InstanceTypeInfo({ data }: Props) {
  const { reset, ...formMethods } = useForm({
    defaultValues: initialFormState,
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (data?.instanceType) {
      reset({
        id: data.instanceType.id,
        name: data.instanceType.name,
        displayName: data.instanceType.displayName,
        description: data.instanceType.description,
        cpuLimit: data.instanceType.cpuLimit,
        gpuLimit: data.instanceType.gpuLimit,
        memoryLimit: data.instanceType.memoryLimit,
        cpuRequest: data.instanceType.cpuRequest,
        memoryRequest: data.instanceType.memoryRequest,
        global: data.instanceType.global,
        tolerations: data.instanceType.tolerations,
        nodeSelector: data.instanceType.nodeSelector,
      });
    }
  }, [data, reset]);

  return (
    <InstanceTypesLayout>
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <InstanceTypeForm disableName loading={data.loading} {...formMethods} />
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
        onError: () => {
          notification.error({
            duration: 5,
            placement: 'bottomRight',
            message: 'Failure',
            description: 'Failure to fetch data, try again later.',
          });
        },
      };
    },
  })
)(_InstanceTypeInfo);
