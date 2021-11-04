import * as React from 'react';
import GroupSettingsMembers from '../members';
import { render, screen } from 'test/test-utils';

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

  return {
    group,
  };
}

describe('GroupSettingsMembers Component', () => {
  it('should render group settings members with loading status', () => {
    const { group } = setup();
    render(<GroupSettingsMembers />);
    expect(screen.getByText('loading...'));
  });

  it('Should render group settings members', async () => {
    const { group } = setup();
    render(<GroupSettingsMembers group={group} />);

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
