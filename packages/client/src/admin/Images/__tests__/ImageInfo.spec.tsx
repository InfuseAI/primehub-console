import React from 'react';
import userEvent from '@testing-library/user-event';
import { Route, MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';
import { IntlProvider } from 'react-intl';

import { render, screen, waitFor } from 'test/test-utils';

import { ImageInfo } from '../ImageInfo';
import { ImageQuery, BaseImagesQuery, SecretsQuery } from '../images.graphql';

function setup() {
  const mockSecretsQuery = {
    request: {
      query: SecretsQuery,
    },
    result: {
      data: {
        secrets: [
          {
            id: 'image-dev-keroro',
            name: 'dev-keroro',
            type: 'kubernetes',
            __typename: 'Secret',
          },
        ],
      },
    },
  };

  const mockBaseImagesQuery = {
    request: {
      query: BaseImagesQuery,
      variables: {
        where: {},
      },
    },
    result: {
      data: {
        images: [
          {
            id: 'keroro',
            displayName: 'keroro',
            description: 'gerogero',
            url: 'https://infuseai.io',
            urlForGpu: 'https://infuseai.io',
            name: 'keroro',
            type: 'cpu',
            groupName: null,
            useImagePullSecret: 'image-dev-keroro',
            logEndpoint: 'http://localhost:3001/logs/images/keroro/job',
            isReady: true,
            spec: {
              description: 'gerogero',
              displayName: 'keroro',
              pullSecret: 'image-dev-keroro',
              type: 'cpu',
              url: 'https://infuseai.io',
              urlForGpu: 'https://infuseai.io',
            },
            global: true,
            jobStatus: null,
            imageSpec: null,
            __typename: 'Image',
          },
          {
            id: 'doraemon',
            displayName: 'doraemon',
            description: '',
            url: 'cpu2',
            urlForGpu: 'cpu2',
            name: 'doraemon',
            type: 'both',
            groupName: null,
            useImagePullSecret: null,
            logEndpoint: 'http://localhost:3001/logs/images/doraemon/job',
            isReady: true,
            spec: {
              description: '',
              displayName: 'doraemon',
              type: 'both',
              url: 'cpu2',
              urlForGpu: 'cpu2',
            },
            global: false,
            jobStatus: null,
            imageSpec: null,
            __typename: 'Image',
          },
        ],
      },
    },
  };

  const mockExistingOneRequests = [
    mockSecretsQuery,
    mockBaseImagesQuery,
    {
      request: {
        query: ImageQuery,
        variables: {
          where: {
            id: 'keroro',
          },
        },
      },
      result: {
        data: {
          image: {
            id: 'keroro',
            groups: [],
            displayName: 'keroro',
            description: 'gerogero',
            url: 'https://infuseai.io',
            urlForGpu: 'https://infuseai.io',
            name: 'keroro',
            type: 'cpu',
            groupName: null,
            useImagePullSecret: 'image-dev-keroro',
            logEndpoint: 'http://localhost:3001/logs/images/keroro/job',
            isReady: true,
            spec: {
              description: 'gerogero',
              displayName: 'keroro',
              pullSecret: 'image-dev-keroro',
              type: 'cpu',
              url: 'https://infuseai.io',
              urlForGpu: 'https://infuseai.io',
            },
            global: false,
            jobStatus: null,
            imageSpec: null,
            __typename: 'Image',
          },
        },
      },
    },
  ];

  const mockCustomImageRequests = [
    mockSecretsQuery,
    mockBaseImagesQuery,
    {
      request: {
        query: ImageQuery,
        variables: {
          where: {
            id: 'keroro',
          },
        },
      },
      result: {
        data: {
          image: {
            id: 'keroro',
            groups: [],
            displayName: 'keroro',
            description: 'gerogero',
            url: 'https://infuseai.io',
            urlForGpu: 'https://infuseai.io',
            name: 'keroro',
            type: 'both',
            groupName: null,
            useImagePullSecret: 'image-dev-keroro',
            logEndpoint: 'http://localhost:3001/logs/images/keroro/job',
            isReady: true,
            spec: {
              description: 'gerogero',
              displayName: 'keroro',
              imageSpec: {
                baseImage: 'infuseai/docker-stacks:base-notebook-3f48358e',
                packages: {
                  apt: ['curl'],
                  pip: [],
                  conda: [],
                  __typename: 'ImageSpecPackages',
                },
                pullSecret: 'image-dev-keroro',
                updateTime: '2021-09-03T12:14:19Z',
              },
            },
            global: false,
            jobStatus: {
              phase: 'Succeeded',
              __typename: 'JobStatus',
            },
            imageSpec: {
              baseImage: 'infuseai/docker-stacks:base-notebook-3f48358e',
              packages: {
                apt: ['curl'],
                pip: [],
                conda: [],
                __typename: 'ImageSpecPackages',
              },
              pullSecret: 'image-dev-keroro',
              updateTime: '2021-09-03T12:14:19Z',
              __typename: 'ImageSpec',
            },
            __typename: 'Image',
          },
        },
      },
    },
  ];

  function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <IntlProvider locale='en'>
        <MemoryRouter initialEntries={['/admin/image/keroro']}>
          <Route path='/admin/image/:id'>{children}</Route>
        </MemoryRouter>
      </IntlProvider>
    );
  }

  return {
    TestProvider,
    mockExistingOneRequests,
    mockCustomImageRequests,
  };
}

beforeEach(() => {
  // @ts-ignore
  global.modelDeploymentOnly = false;
});

describe('ImageInfo', () => {
  it('should render image info with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <ImageInfo />
        </MockedProvider>
      </TestProvider>
    );

    expect(
      await screen.findByText('Failure to fetch image information.')
    ).toBeInTheDocument();
  });

  it('should render the type of cpu image info with fetched data', async () => {
    const { TestProvider, mockExistingOneRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockExistingOneRequests}>
          <ImageInfo />
        </MockedProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveDisplayValue('keroro');
      expect(screen.getByLabelText('Display Name')).toHaveDisplayValue(
        'keroro'
      );
      expect(screen.getByLabelText('Description')).toHaveDisplayValue(
        'gerogero'
      );
      expect(screen.getByTestId('type')).toHaveTextContent('CPU');
      expect(screen.getByLabelText('Container Image URL')).toHaveDisplayValue(
        'https://infuseai.io'
      );
      expect(screen.getByTestId('useImagePullSecret')).toHaveTextContent(
        'dev-keroro'
      );
      expect(screen.getByTestId('global')).not.toBeChecked();
    });
  });

  it('should display `Specific container image URL for GPU` field when type as universal', async () => {
    const { TestProvider, mockExistingOneRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockExistingOneRequests}>
          <ImageInfo />
        </MockedProvider>
      </TestProvider>
    );

    const typeSelector = await screen.findByTestId('type');
    userEvent.click(typeSelector);

    const universalOption = await screen.findByText('Universal');
    userEvent.click(universalOption);

    expect(screen.getByTestId('type')).toHaveTextContent('Universal');
    expect(
      screen.getByLabelText('Specific Container Image URL for GPU')
    ).toBeInTheDocument();
  });

  it('should render the custom image with success build from fetched data', async () => {
    const { TestProvider, mockCustomImageRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockCustomImageRequests}>
          <ImageInfo />
        </MockedProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('View build details')).toBeInTheDocument();
    });
  });
});
