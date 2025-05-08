import React from 'react';
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
import {
  ImageQuery,
  UpdateImageMutation,
  RebuildImageMutation,
  CancelImageBuildMutation,
} from './images.graphql';
import type { Image, ImageSpec } from './types';

interface Props {
  imageQuery: {
    error: Error | undefined;
    loading: boolean;
    image?: Image;
    refetch: () => Promise<Image>;
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

  rebuildImageMutation: ({
    variables,
  }: {
    variables: {
      data: ImageSpec;
      where: {
        id: string;
      };
    };
  }) => Promise<void>;

  cancelImageBuildMutation: ({
    variables,
  }: {
    variables: {
      where: {
        id: string;
      };
    };
  }) => Promise<void>;
}

function _ImageInfo({
  imageQuery,
  updateImageMutation,
  rebuildImageMutation,
  cancelImageBuildMutation,
}: Props) {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const { appPrefix } = useRoutePrefix();
  const fieldsToTrim = [
    'displayName',
    'description',
    'url',
    'urlForGpu',
  ];

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
          'pullSecret', // just only display on the custom image
          'imageSpec', // `imageSpec` can be edited by rebuild image mutation
        ]),
      };
    }

    for (const field of fieldsToTrim) {
      formData[field] = formData[field].trim()
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

  async function onRebuild(imageSpec: ImageSpec) {
    try {
      await rebuildImageMutation({
        variables: {
          data: imageSpec,
          where: {
            id,
          },
        },
      });

      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Successfully!',
        description: 'Your image starting to rebuild.',
      });

      await imageQuery.refetch();
    } catch (err) {
      console.error(err);
      notification.error({
        duration: 5,
        placement: 'bottomRight',
        message: 'Failure!',
        description: 'Rebuilding image failure.',
      });
    }
  }

  async function onCancelBuild(imageId: string) {
    try {
      await cancelImageBuildMutation({
        variables: {
          where: {
            id: imageId,
          },
        },
      });

      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Successfully!',
        description: 'Canceling image build.',
      });

      await imageQuery.refetch();
    } catch (err) {
      console.error(err);
      notification.error({
        duration: 5,
        placement: 'bottomRight',
        message: 'Failure!',
        description: 'Canceling image build failure.',
      });
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
          onRebuild={onRebuild}
          onCancelBuild={onCancelBuild}
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
        pollInterval: 10000,
        onError: () => {
          notification.error({
            duration: 5,
            placement: 'bottomRight',
            message: 'Failure!',
            description: 'Failure to fetch image information.',
          });
        },
      };
    },
  }),
  graphql(UpdateImageMutation, {
    name: 'updateImageMutation',
  }),
  graphql(RebuildImageMutation, {
    name: 'rebuildImageMutation',
  }),
  graphql(CancelImageBuildMutation, {
    name: 'cancelImageBuildMutation',
  })
)(_ImageInfo);
