import * as React from 'react';
import { compose } from 'recompose';
import { useHistory, withRouter, RouteComponentProps } from 'react-router-dom';
import { notification, Skeleton } from 'antd';
import {injectIntl} from 'react-intl';
import { graphql } from 'react-apollo';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import { DatasetLayout } from './Layout';
import { DatasetForm, initialFormState } from './DatasetForm';
import { DatasetQuery, UpdateDatasetMutation } from 'queries/Datasets.graphql';
import type { TDataset } from './types';
import { pick } from 'lodash';
import uploadServerSecretModal from 'cms-components/uploadServerSecretModal';
import { errorHandler } from 'utils/errorHandler';

interface Props {
  intl: any,
  datasetQuery: {
    error: Error | undefined;
    loading: boolean;
    dataset?: TDataset;
  };
  updateDatasetMutation: ({
    variables,
  }: {
    variables: {
      payload: Partial<TDataset>;
      where: Pick<TDataset, 'id'>;
    };
  }) => Promise<void>;
}

function _DatasetInfo({ datasetQuery, updateDatasetMutation, intl }: Props) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  if (datasetQuery.error) {
    return <div>Failure to load datasets.</div>;
  }

  if (datasetQuery.loading) {
    return <Skeleton />
  }

  async function onSubmit(data: TDataset) {
    try {
      const result = await updateDatasetMutation({
        variables: {
          payload: data,
          where: {
            id: data.name,
          },
        },
      });

      const secret = result?.data?.updateDataset?.uploadServerSecret;
      if (secret) {
        uploadServerSecretModal({
          title: intl.formatMessage({id: 'dataset.regenerateSecretModalTitle'}),
          secret,
        });
      }

      history.push(`${appPrefix}admin/dataset`);
    } catch (err) {
      errorHandler(err);
    }
  }

  return (
    <DatasetLayout page="edit">
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <DatasetForm initialValue={datasetQuery?.dataset} editMode onSubmit={onSubmit} />
      </div>
    </DatasetLayout>
  );
}

export const DatasetInfo = compose(
  injectIntl,
  withRouter,
  graphql(DatasetQuery, {
    name: 'datasetQuery',
    options: ({ match }: RouteComponentProps<{ id: string }>) => {
      const datasetId = match.params.id;

      return {
        fetchPolicy: 'cache-and-network',
        variables: {
          where: {
            id: datasetId,
          },
        },
      };
    },
  }),
  graphql(UpdateDatasetMutation, {
    name: 'updateDatasetMutation',
  })
)(_DatasetInfo);
