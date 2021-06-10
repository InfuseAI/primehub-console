import * as React from 'react';
import GroupSettingsMLflow from '../mlflow';
import { render, screen } from 'test/test-utils';
import { GroupContext } from 'context/group';
import { UserContext } from 'context/user';
import { MockedProvider } from 'react-apollo/test-utils';
import { GetGroupMLflowConfig } from 'queries/Group.graphql';
import { mlflow } from '../../../../fakeData/groups';

const AllTheProviders = ({ children }) => {
  const mlflowConfigMock = {
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
          mlflow: mlflow,
        },
      },
    },
  };
  
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
    <MockedProvider mocks={[mlflowConfigMock]} addTypename={false}>
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
    screen.queryAllByDisplayValue('http://localhost:5000').forEach(uri => expect(uri).toBeInTheDocument());
    expect(screen.queryByDisplayValue('FOO')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('BAR_A')).toBeInTheDocument();
  });
});
