import React from 'react';
import { useHistory } from 'react-router-dom';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import { omit } from 'lodash';
import { notification } from 'antd';

import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { errorHandler } from 'utils/errorHandler';

import { ImagesLayout } from './Layout';
import { ImageForm, ImageFormState } from './ImageForm';
import { CreateImageMutation } from './images.graphql';
import type { ImageSpec } from './types';

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
    // When creating an image, omit the `groups.disconnect` field
    let formData = omit(
      restData,
      'groups.disconnect',
      'baseImage',
      'apt',
      'conda',
      'pip'
    );

    if (isBuildByCustomImage) {
      const imageSpec: ImageSpec = {
        baseImage: restData.imageSpec.baseImage.trim(),
        pullSecret: restData.imageSpec.pullSecret,
        // @ts-ignore
        packages: {},
      };

      if (restData.apt.length > 0) {
        imageSpec.packages['apt'] = restData.apt.split('\n');
      }

      if (restData.conda.length > 0) {
        imageSpec.packages['conda'] = restData.conda.split('\n');
      }

      if (restData.pip.length > 0) {
        imageSpec.packages['pip'] = restData.pip.split('\n');
      }

      formData = {
        ...omit(formData, [
          'pullSecret', // just only display on the custom image
          'useImagePullSecret',
        ]),
        imageSpec,
      };
    }

    for (const field of fieldsToTrim) {
      if (field in formData && typeof formData[field] === 'string') {
        formData[field] = formData[field].trim();
      }
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
