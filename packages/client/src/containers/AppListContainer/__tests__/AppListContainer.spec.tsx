import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';

import AppListContainer from '..';
import { GroupContextValue } from 'context/group';
import { render, screen } from 'test/test-utils';
import { PhApplicationsConnection } from 'queries/PhApplication.graphql';

import { groups as mockGroups } from '../../../fakeData/groups';

function setup() {
  const mockGroupContext: GroupContextValue = {
    id: 'groupId1',
    name: 'group1',
    displayName: 'group1',
    admins: 'test-user',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const mockRequests = [
    {
      request: {
        query: PhApplicationsConnection,
        variables: {
          first: 12,
          where: {
            groupName_in: [mockGroupContext.name],
          },
        },
      },
      result: {
        data: {
          phApplicationsConnection: {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'app-0001',
              endCursor: 'app-0001',
              __typename: 'PhApplicationPageInfo',
            },
            edges: [
              {
                cursor: 'app-0001',
                node: {
                  id: 'app-0001',
                  displayName: 'My MLflow',
                  appVersion: 'v1.9.0',
                  appName: 'mlflow',
                  appIcon:
                    'https://avatars.githubusercontent.com/u/39938107?s=400&v=4',
                  appDefaultEnv: [
                    {
                      name: 'BACKEND_STORE_URI',
                      defaultValue: 'sqlite://$(PRIMEHUB_APP_ROOT)/mlflow.db',
                      optional: false,
                      description: 'Backend Store URI',
                      __typename: null,
                    },
                    {
                      name: 'DEFAULT_ARTIFACT_ROOT',
                      defaultValue: '$(PRIMEHUB_APP_ROOT)/mlruns',
                      optional: false,
                      description: '',
                      __typename: null,
                    },
                  ],
                  appTemplate: {
                    name: 'MLfow',
                    docLink: 'https://www.mlflow.org/docs/latest/index.html',
                    description:
                      'MLflow is an open source platform to manage the ML lifecycle, including experimentation, reproducibility, deployment, and a central model registry.',
                    __typename: null,
                  },
                  groupName: 'Group1',
                  instanceType: 'g-it1',
                  instanceTypeSpec: {
                    name: null,
                    displayName: 'group1 it',
                    cpuLimit: 0.5,
                    memoryLimit: 4,
                    gpuLimit: 0,
                    __typename: null,
                  },
                  scope: 'public',
                  appUrl: 'https://endpoint/modedeployment/example/test/1',
                  internalAppUrl: 'app-mlflow-0001:5000/',
                  svcEndpoints: [
                    'app-mlflow-0001:5000/',
                    'app-mlflow-0002:5000/',
                  ],
                  env: [
                    {
                      name: 'BACKEND_STORE_URI',
                      value: 'sqlite://$(PRIMEHUB_APP_ROOT)/mlflow.db',
                      __typename: null,
                    },
                    {
                      name: 'DEFAULT_ARTIFACT_ROOT',
                      value: '$(PRIMEHUB_APP_ROOT)/mlruns',
                      __typename: null,
                    },
                  ],
                  stop: false,
                  status: 'Ready',
                  message: 'batch1 batch2 batch3 batch4 ',
                  pods: null,
                  __typename: 'PhApplication',
                },
                __typename: 'PhApplicationEdge',
              },
            ],
            __typename: 'PhApplicationConnection',
          },
        },
      },
    },
  ];

  return {
    mockGroupContext,
    mockRequests,
  };
}

describe('AppListContainer', () => {
  it('should render app list container with loading status', () => {
    const { mockGroupContext } = setup();

    render(
      <MockedProvider>
        <MemoryRouter>
          <AppListContainer
            groups={mockGroups}
            groupContext={mockGroupContext}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render app list container with error message', async () => {
    const { mockGroupContext } = setup();

    render(
      <MockedProvider>
        <MemoryRouter>
          <AppListContainer
            groups={mockGroups}
            groupContext={mockGroupContext}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('should render app list container and get apps', async () => {
    const { mockGroupContext, mockRequests } = setup();

    render(
      <MockedProvider mocks={mockRequests}>
        <MemoryRouter>
          <AppListContainer
            groups={mockGroups}
            groupContext={mockGroupContext}
          />
        </MemoryRouter>
      </MockedProvider>
    );

    expect(await screen.findByText('Applications')).toBeInTheDocument();
    expect(await screen.findByText('Refresh')).toBeInTheDocument();
    expect(await screen.findByText('My MLflow')).toBeInTheDocument();
  });
});
