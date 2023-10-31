import * as React from 'react';
import GroupSettingsMembers from '../members';
import { render, screen } from 'test/test-utils';
import { MockedProvider } from 'react-apollo/test-utils';
import { GetGroupUsers } from 'queries/Group.graphql';

function setup() {
  const group = {
    id: 'test-group',
    name: 'test-group',
    admins: 'user1,user3',
    users: [
      { id: '1', username: 'user1' },
      { id: '2', username: 'user2' },
      { id: '3', username: 'user3' },
    ],
  };

  const mocks = [
    {
      request: {
        query: GetGroupUsers,
        variables: {
          where: {
            id: group.id,
          },
        },
      },
      result: {
        data: {
          group,
        },
      },
    },
  ];

  return {
    group,
    mocks,
  };
}

describe('GroupSettingsMembers Component', () => {
  it('should render group settings members with loading status', () => {
    render(
      <MockedProvider mocks={[]}>
        <GroupSettingsMembers />
      </MockedProvider>
    );
    expect(screen.getByText('loading...'));
  });

  it('Should render group settings members', async () => {
    const { group, mocks } = setup();
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <GroupSettingsMembers group={group} />
      </MockedProvider>
    );

    expect(await screen.findByText('Group Admin')).toBeInTheDocument();
    expect(await screen.findByText('user1')).toBeInTheDocument();
    expect(await screen.findByText('user2')).toBeInTheDocument();
    expect(await screen.findByText('user3')).toBeInTheDocument();

    const checkbox1 = screen
      .getByText('user1')
      .closest('tr')
      .querySelector('input');
    const checkbox2 = screen
      .getByText('user2')
      .closest('tr')
      .querySelector('input');
    const checkbox3 = screen
      .getByText('user3')
      .closest('tr')
      .querySelector('input');
    expect(checkbox1.checked).toBe(true);
    expect(checkbox2.checked).toBe(false);
    expect(checkbox3.checked).toBe(true);
  });
});
