import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen } from 'test/test-utils';

import { ImageList } from '../ImageList';
import { ImagesQuery } from '../images.graphql';

function setup() {
  const mockRequests = [
    {
      request: {
        query: ImagesQuery,
        variables: {
          page: 1,
        },
      },
      result: {
        data: {
          imagesConnection: {
            edges: [
              {
                cursor: 'a-img',
                node: {
                  id: 'a-img',
                  name: 'a-img',
                  displayName: 'A Image',
                  description: '',
                  type: 'cpu',
                  isReady: true,
                  __typename: 'Image',
                },
                __typename: 'ImageEdge',
              },
              {
                cursor: 'b-img',
                node: {
                  id: 'b-img',
                  name: 'b-img',
                  displayName: 'B Image',
                  description: '',
                  type: 'gpu',
                  isReady: true,
                  __typename: 'Image',
                },
                __typename: 'ImageEdge',
              },
              {
                cursor: 'c-img',
                node: {
                  id: 'c-img',
                  name: 'c-img',
                  displayName: 'C Image',
                  description: '',
                  type: 'both',
                  isReady: true,
                  __typename: 'Image',
                },
                __typename: 'ImageEdge',
              },
            ],
            pageInfo: {
              currentPage: 1,
              totalPage: 10,
              __typename: 'PageInfo',
            },
            __typename: 'ImageConnection',
          },
        },
      },
    },
  ];

  function TestProvider({ children }: { children: React.ReactNode }) {
    return <MemoryRouter>{children}</MemoryRouter>;
  }

  return {
    TestProvider,
    mockRequests,
  };
}

describe('Images', () => {
  it('should render image list with error messages', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={[]}>
          <ImageList />
        </MockedProvider>
      </TestProvider>
    );

    expect(await screen.findByText('Server Error')).toBeInTheDocument();
  });

  it('should render images with fetched data', async () => {
    const { TestProvider, mockRequests } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <ImageList />
        </MockedProvider>
      </TestProvider>
    );

    expect(await screen.findByText('A Image')).toBeInTheDocument();
    expect(await screen.findByText('CPU')).toBeInTheDocument();
    expect(await screen.findByText('B Image')).toBeInTheDocument();
    expect(await screen.findByText('GPU')).toBeInTheDocument();
    expect(await screen.findByText('C Image')).toBeInTheDocument();
    expect(await screen.findByText('Universal')).toBeInTheDocument();
  });
});
