import * as React from 'react';
import GroupSettingsMLflow from '../mlflow';
import { render, screen, waitFor } from 'test/test-utils';
import { GroupContext } from 'context/group';
import { UserContext } from 'context/user';
import { MockedProvider } from 'react-apollo/test-utils';
import { GetGroupMLflowConfig } from 'queries/Group.graphql';
import { PhApplicationsConnection } from 'queries/PhApplication.graphql';
import { mlflow } from '../../../../fakeData/groups';

const phApplicationEdges = [
  {
    cursor: 'mlflow-x98ab',
    node: {
      id: 'mlflow-x98ab',
      displayName: 'test-mlflow',
      appVersion: 'v1.9.1',
      appName: 'mlflow',
      groupName: 'InfuseAICat',
      instanceType: 'cpu-only',
      scope: 'primehub',
      appUrl: 'http://localhost:3001/console/apps/mlflow-x98ab',
      internalAppUrl: 'http://app-mlflow-x98ab:5000/console/apps/mlflow-x98ab',
      svcEndpoints: ['app-mlflow-x98ab:5000'],
      stop: false,
      status: 'Ready',
      message: 'Deployment is ready',
    },
  },
];

const AllTheProviders = ({ children }) => {
  const mocks = [
    {
      request: {
        query: GetGroupMLflowConfig,
        variables: {
          where: {
            id: 'test-group',
          },
        },
      },
      result: {
        data: {
          group: {
            id: 'test-group',
            name: 'test-group',
            mlflow,
          },
        },
      },
    },
    {
      request: {
        query: PhApplicationsConnection,
        variables: {
          first: 999,
          where: {
            appName_contains: 'mlflow',
            groupName_in: ['test-group'],
          },
        },
      },
      result: {
        data: {
          phApplicationsConnection: {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mlflow-x98ab',
              endCursor: 'mlflow-x98ab',
            },
            edges: phApplicationEdges,
          },
        },
      },
    },
  ];

  const groupValue = {
    id: 'test-group',
    name: 'test-group',
    displayName: 'test-group',
    admins: 'test',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const userValue = {
    id: '1',
    username: 'test',
    isCurrentGroupAdmin: true,
  };

  return (
    <MockedProvider mocks={mocks} addTypename={false}>
      <GroupContext.Provider value={groupValue}>
        <UserContext.Provider value={userValue}>
          {children}
        </UserContext.Provider>
      </GroupContext.Provider>
    </MockedProvider>
  );
};

describe('GroupSettingsMLflow Component', () => {
  it('Should render group settings mlflow', async () => {
    render(<GroupSettingsMLflow />, { wrapper: AllTheProviders });
    // wait for response
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.queryByText('MLflow Tracking URI')).toBeInTheDocument();
    screen
      .queryAllByDisplayValue('http://localhost:5000')
      .forEach(uri => expect(uri).toBeInTheDocument());
    expect(screen.queryByDisplayValue('FOO')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('BAR_A')).toBeInTheDocument();
  });

  it('Should render mlflow selector', async () => {
    render(<GroupSettingsMLflow />, {
      wrapper: AllTheProviders,
    });
    waitFor(() => {
      expect(screen.queryByText('Select MLflow Apps')).toBeInTheDocument();
    });
  });
});
