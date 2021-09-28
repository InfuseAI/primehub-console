import * as React from 'react';
import { render, screen } from 'test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../landing';
import { GroupContext } from 'context/group';
import { UserContext } from 'context/user';
import { MockedProvider } from 'react-apollo/test-utils';
import me from '../fakeData/me';
import { CurrentUser } from 'queries/User.graphql';

const mocks = [
  {
    request: {
      query: CurrentUser,
    },
    result: {
      me,
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

const AllTheProviders = ({ children }) => {
  return (
    // @ts-ignore
    <MockedProvider mocks={mocks}>
      <GroupContext.Provider value={groupValue}>
        <UserContext.Provider value={userValue}>
          <MemoryRouter>{children}</MemoryRouter>
        </UserContext.Provider>
      </GroupContext.Provider>
    </MockedProvider>
  );
};

describe('Landing Page', () => {
  it('Full function PrimeHub Should render landing page properly', () => {
    // @ts-ignore
    global.modelDeploymentOnly = false;
    // @ts-ignore
    global.primehubCE = false;
    render(<Landing />, { wrapper: AllTheProviders });
    expect(screen.queryByText('User Guide')).toBeInTheDocument();
    expect(screen.queryByText('Create New Job')).toBeInTheDocument();
  });

  it('PrimeHub Deploy Should render landing page properly', () => {
    // @ts-ignore
    global.modelDeploymentOnly = true;
    // @ts-ignore
    global.primehubCE = false;
    render(<Landing />, { wrapper: AllTheProviders });
    expect(screen.queryByText('User Guide')).toBeInTheDocument();
    expect(screen.queryByText('Deploy Model')).toBeInTheDocument();
    expect(screen.queryByText('Open Jupyter Notebook')).not.toBeInTheDocument();
  });

  it('PrimeHub Deploy Should render landing page properly', () => {
    // @ts-ignore
    global.modelDeploymentOnly = false;
    // @ts-ignore
    global.primehubCE = true;
    render(<Landing />, { wrapper: AllTheProviders });
    expect(screen.queryByText('User Guide')).toBeInTheDocument();
    expect(screen.queryByText('Open Jupyter Notebook')).toBeInTheDocument();
    expect(screen.queryByText('Create New Job')).not.toBeInTheDocument();
  });
});
