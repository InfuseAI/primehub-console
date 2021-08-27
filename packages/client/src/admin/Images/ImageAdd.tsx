import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { omit } from 'lodash';
import { notification } from 'antd';

import { useRoutePrefix } from 'hooks/useRoutePrefix';

import { ImagesLayout } from './Layout';
import { ImageForm, ImageFormState } from './ImageForm';
import { CreateImageMutation } from './images.graphql';
import { errorHandler } from 'utils/errorHandler';

interface Props {
  createImageMutation: ({
    variables,
  }: {
    variables: {
      data: Partial<ImageFormState>;
    };
  }) => Promise<{ data: { createImage: { id: string } } }>;
}

function _ImageAdd({ createImageMutation }: Props) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();

  async function onSubmit({
    isBuildByCustomImage,
    ...restData
  }: ImageFormState) {
    // When create image, omit `groups.disconnect` field
    let formData = omit(restData, 'groups.disconnect');

    if (isBuildByCustomImage) {
      formData = {
        ...omit(restData, [
          'baseImage',
          'apt',
          'conda',
          'pip',
          'useImagePullSecret',
          'groups.disconnect',
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
      const {
        data: { createImage },
      } = await createImageMutation({
        variables: {
          data: formData,
        },
      });

      history.push(`${appPrefix}admin/image`);
      notification.success({
        duration: 5,
        placement: 'bottomRight',
        message: 'Save successfully!',
        description: (
          <>
            Your changes have been saved. Click{' '}
            <span
              style={{ color: '#365abd', cursor: 'pointer' }}
              onClick={() =>
                history.push(`${appPrefix}admin/image/${createImage.id}`)
              }
            >
              here
            </span>{' '}
            to edit.
          </>
        ),
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
        <ImageForm onSubmit={onSubmit} />
      </div>
    </ImagesLayout>
  );
}

export const ImageAdd = compose(
  graphql(CreateImageMutation, {
    name: 'createImageMutation',
  })
)(_ImageAdd);
