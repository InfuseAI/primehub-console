import * as React from 'react';
import GroupSettingsMembers from '../members';
import { MockedProvider } from 'react-apollo/test-utils';
import { render, screen } from 'test/test-utils';
import { GetGroupUsers } from 'queries/Group.graphql';

const AllTheProviders = ({ children }) => {
  const groupUsersMock = {
    request: {
      query: GetGroupUsers,
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
          admins: 'user1,user3',
          users: [
            { username: 'user1' },
            { username: 'user2' },
            { username: 'user3' },
          ],
        },
      },
    },
  };

  return (
    <MockedProvider mocks={[groupUsersMock]} addTypename={false}>
      {children}
    </MockedProvider>
  );
};

function setup() {
  const group = {
    id: 'test-group',
  };

  return {
    group,
  };
}

describe('GroupSettingsMembers Component', () => {
  it('should render group settings members with loading status', () => {
    const { group } = setup();
    render(<GroupSettingsMembers group={group} />, {
      wrapper: AllTheProviders,
    });
    expect(screen.getByText('loading...'));
  });

  it('Should render group settings members', async () => {
    const { group } = setup();
    render(<GroupSettingsMembers group={group} />, { wrapper: AllTheProviders });

    expect(await screen.findByText('Group Admin')).toBeInTheDocument();
    expect(await screen.findByText('user1')).toBeInTheDocument();
    expect(await screen.findByText('user2')).toBeInTheDocument();
    expect(await screen.findByText('user3')).toBeInTheDocument();

    const checkbox1 = screen.getByText('user1').closest('tr').querySelector('input');
    const checkbox2 = screen.getByText('user2').closest('tr').querySelector('input');
    const checkbox3 = screen.getByText('user3').closest('tr').querySelector('input');
    expect(checkbox1.checked).toBe(true);
    expect(checkbox2.checked).toBe(false);
    expect(checkbox3.checked).toBe(true);
  });
});
