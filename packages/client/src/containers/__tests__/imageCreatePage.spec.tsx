import * as React from 'react';
import { render, screen } from 'test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import ImageCreatePage from 'containers/imageCreatePage';
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

describe('ImageCreateForm Container', () => {
  it('Should render create page properly', async () => {
    // @ts-ignore
    global.customImageSetup = 'true';
    render(<ImageCreatePage />, { wrapper: AllTheProviders });
    expect(await screen.findByText('Container Image URL')).toBeInTheDocument();
  });
});
