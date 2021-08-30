import * as React from 'react';
import {
  /*useHistory, withRouter,*/ RouteComponentProps,
} from 'react-router-dom';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';

import { errorHandler } from 'utils/errorHandler';

import { ImagesLayout } from './Layout';
import { ImageForm } from './ImageForm';
import { ImageQuery } from './images.graphql';
import type { Image } from './types';

interface Props {
  imageQuery: {
    error: Error | undefined;
    loading: boolean;
    image?: Image;
  };
  // updateInstanceTypeMutation: ({
  //   variables,
  // }: {
  //   variables: {
  //     payload: InstanceTypeFormState;
  //     where: Pick<InstanceTypeFormState, 'id'>;
  //   };
  // }) => Promise<void>;
}

function _ImageInfo({ imageQuery }: Props) {
  return (
    <ImagesLayout>
      <div
        style={{
          margin: '16px',
          padding: '32px',
          backgroundColor: '#fff',
        }}
      >
        <ImageForm loading={imageQuery.loading} data={imageQuery?.image} />
      </div>
    </ImagesLayout>
  );
}

export const ImageInfo = compose(
  // withRouter,
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
  })
)(_ImageInfo);
