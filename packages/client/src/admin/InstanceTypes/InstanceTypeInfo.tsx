import * as React from 'react';
import { compose } from 'recompose';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { graphql } from 'react-apollo';
import { notification } from 'antd';

import { InstanceTypesLayout } from './Layout';
import { InstanceTypeForm, InstanceTypeFormState } from './InstanceTypeForm';
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
          onSubmit={(data: InstanceTypeFormState) => {
            console.log(data);
          }}
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
