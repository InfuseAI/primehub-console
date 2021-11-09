import React from 'react';
import { MockedProvider } from 'react-apollo/test-utils';

import { render, screen } from 'test/test-utils';
import { GroupContext } from 'context/group';

import Browser, { GET_FILES } from '../Browser';

function setup() {
  const mockGroups = {
    id: 'test-group',
    displayName: 'InfuseAICat',
    name: 'InfuseAICat',
    admins: 'test',
    enabledDeployment: false,
    enabledSharedVolume: false,
  };

  const mockRequests = [
    {
      request: {
        query: GET_FILES,
        variables: {
          where: {
            phfsPrefix: '/',
            groupName: 'InfuseAICat',
          },
        },
      },
      result: {
        data: {
          files: {
            prefix: 'groups/infuseaicat/',
            phfsPrefix: '/',
            items: [
              {
                name: 'Untitled.ipynb',
                size: 19339,
                lastModified: '2021-09-07T08:53:11.353Z',
                __typename: 'StoreFile',
              },
              {
                name: 'saved_model.ipynb',
                size: 174091,
                lastModified: '2021-09-07T08:49:18.820Z',
                __typename: 'StoreFile',
              },
              {
                name: 'pj/',
                size: 0,
                lastModified: null,
                __typename: 'StoreFile',
              },
            ],
            __typename: 'StoreFileList',
          },
        },
      },
    },
  ];

  return {
    mockRequests,
    mockGroups,
  };
}

describe('BrowseSharedFiles', () => {
  it('should render browse shared files with error messages', async () => {
    render(
      <MockedProvider mocks={[]}>
        <GroupContext.Provider
          value={{
            id: 'test-group',
            displayName: 'InfuseAICat',
            name: 'InfuseAICat',
            admins: 'test',
            enabledDeployment: false,
            enabledSharedVolume: false,
          }}
        >
          <Browser enabledPHFS path='/' />
        </GroupContext.Provider>
      </MockedProvider>
    );

    expect(await screen.findByText('Server Error')).toBeInTheDocument();
  });

  it('should render browse shared files with fetched data', async () => {
    const { mockRequests, mockGroups } = setup();

    render(
      <MockedProvider mocks={mockRequests}>
        <GroupContext.Provider value={mockGroups}>
          <Browser enabledPHFS path='/' />
        </GroupContext.Provider>
      </MockedProvider>
    );

    expect(await screen.findByText('pj/')).toBeInTheDocument();
  });

  it('should render browse shared files with unenabled phfs alert message', () => {
    const { TestProvider, mockRequests, mockGroups } = setup();

    render(
      <TestProvider>
        <MockedProvider mocks={mockRequests}>
          <GroupContext.Provider value={mockGroups}>
            <Browser enabledPHFS={false} path='/' />
          </GroupContext.Provider>
        </MockedProvider>
      </TestProvider>
    );

    expect(
      screen.getByText(
        'PHFS is not enabled. Please tell your administrator to enable it.'
      )
    ).toBeInTheDocument();
  });
});
