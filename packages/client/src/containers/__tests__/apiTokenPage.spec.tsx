import * as React from 'react';
import { render, screen } from 'test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import ApiTokenPage from 'containers/apiTokenPage';
import { GroupContext } from 'context/group';
import { UserContext } from 'context/user';
import { MockedProvider } from 'react-apollo/test-utils';

const AllTheProviders = ({ children }) => {
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
    <MockedProvider>
      <GroupContext.Provider value={groupValue}>
        <UserContext.Provider value={userValue}>
          <MemoryRouter>{children}</MemoryRouter>
        </UserContext.Provider>
      </GroupContext.Provider>
    </MockedProvider>
  );
};

describe('ApiToken page Container', () => {
  it('Should render apiToken page properly', () => {
    render(<ApiTokenPage />, { wrapper: AllTheProviders });
    expect(screen.queryByText('Request API Token')).toBeInTheDocument();
  });

  it('Should apiToken render current apiToken when window.apiToken exists.', () => {
    const testApiToken = 'test-api-token';
    // @ts-ignore
    global.apiToken = testApiToken;
    render(<ApiTokenPage />, { wrapper: AllTheProviders });
    expect(screen.queryByDisplayValue(testApiToken)).toContainHTML('<Input readOnly');
  });
});
