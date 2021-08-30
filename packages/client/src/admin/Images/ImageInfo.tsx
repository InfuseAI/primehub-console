import * as React from 'react';
import {
  useParams,
  useHistory,
  withRouter,
  RouteComponentProps,
} from 'react-router-dom';
import { notification } from 'antd';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { omit } from 'lodash';

import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';

import { ImagesLayout } from './Layout';
import { ImageForm, ImageFormState } from './ImageForm';
import { ImageQuery, UpdateImageMutation } from './images.graphql';
import type { Image } from './types';

interface Props {
  imageQuery: {
    error: Error | undefined;
    loading: boolean;
    image?: Image;
  };
  updateImageMutation: ({
    variables,
  }: {
    variables: {
      data: Partial<ImageFormState>;
      where: {
        id: string;
      };
    };
  }) => Promise<void>;
}

function _ImageInfo({ imageQuery, updateImageMutation }: Props) {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const { appPrefix } = useRoutePrefix();

  async function onSubmit({
    isBuildByCustomImage,
    ...restData
  }: ImageFormState) {
    let formData = restData;

    if (isBuildByCustomImage) {
      formData = {
        ...omit(restData, [
          'baseImage',
          'apt',
          'conda',
          'pip',
          'useImagePullSecret',
        ]),
        imageSpec: {
          baseImage: restData.baseImage,
          packages: {
            apt: restData.apt.split('\n'),
            conda: restData.conda.split('\n'),
            pip: restData.pip.split('\n'),
          },
          pullSecret: restData.useImagePullSecret,
        },
      };
    }

    try {
      await updateImageMutation({
        variables: {
          data: formData,
          where: {
            id,
          },
        },
      });

      history.push(`${appPrefix}admin/image`);

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
    <ImagesLayout>
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <ImageForm
          disabledName
          loading={imageQuery.loading}
          data={imageQuery?.image}
          onSubmit={onSubmit}
        />
      </div>
    </ImagesLayout>
  );
}

export const ImageInfo = compose(
  withRouter,
  graphql(ImageQuery, {
    name: 'imageQuery',
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
  graphql(UpdateImageMutation, {
    name: 'updateImageMutation',
  })
)(_ImageInfo);
