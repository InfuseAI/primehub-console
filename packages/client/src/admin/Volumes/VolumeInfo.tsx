import * as React from 'react';
import { compose } from 'recompose';
import { useHistory, withRouter, RouteComponentProps } from 'react-router-dom';
import { notification, Skeleton } from 'antd';
import {injectIntl} from 'react-intl';
import { graphql } from 'react-apollo';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import { VolumeLayout } from './Layout';
import { VolumeForm, initialFormState } from './VolumeForm';
import { VolumeQuery, UpdateVolumeMutation } from 'queries/Volumes.graphql';
import type { TVolume } from './types';
import { pick } from 'lodash';
import uploadServerSecretModal from 'cms-components/uploadServerSecretModal';
import { errorHandler } from 'utils/errorHandler';

interface Props extends RouteComponentProps<{ id: string }> {
  intl: any;
  fetchPolicy: string;
  volumeQuery: {
    error: Error | undefined;
    loading: boolean;
    volume?: TVolume;
  };
  updateVolumeMutation: ({
    variables,
  }: {
    variables: {
      payload: Partial<TVolume>;
      where: Pick<TVolume, 'id'>;
    };
  }) => Promise<void>;
}

function _VolumeInfo({ volumeQuery, updateVolumeMutation, intl }: Props) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  if (volumeQuery.error) {
    return <div>Failure to load volumes.</div>;
  }

  if (volumeQuery.loading) {
    return <Skeleton />
  }

  async function onSubmit(data: TVolume) {
    try {
      const result = await updateVolumeMutation({
        variables: {
          payload: data,
          where: {
            id: data.name,
          },
        },
      });

      const secret = result?.data?.updateVolume?.uploadServerSecret;
      if (secret) {
        uploadServerSecretModal({
          title: intl.formatMessage({id: 'volume.regenerateSecretModalTitle'}),
          secret,
        });
      }

      history.push(`${appPrefix}admin/volume`);
    } catch (err) {
      errorHandler(err);
    }
  }

  return (
    <VolumeLayout page="edit">
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <VolumeForm initialValue={volumeQuery?.volume} editMode onSubmit={onSubmit} />
      </div>
    </VolumeLayout>
  );
}

export const VolumeInfo = compose(
  injectIntl,
  withRouter,
  graphql(VolumeQuery, {
    name: 'volumeQuery',
    options: ({ match, fetchPolicy }: Props) => {
      const volumeId = match.params.id;

      return {
        fetchPolicy: fetchPolicy ? fetchPolicy : 'cache-and-network',
        variables: {
          where: {
            id: volumeId,
          },
        },
      };
    },
  }),
  graphql(UpdateVolumeMutation, {
    name: 'updateVolumeMutation',
  })
)(_VolumeInfo);
