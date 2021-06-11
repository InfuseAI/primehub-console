import * as React from 'react';
import GroupSettingsMembers from '../members';
import { render, screen } from 'test/test-utils';

function setup() {
  const group = {
    name: 'test-group',
    displayName: 'Test Group',
    admins: 'user1,user3',
    users: [
      { username: 'user1' },
      { username: 'user2' },
      { username: 'user3' },
    ],
  };

  return {
    group,
  };
}

describe('GroupSettingsMembers Component', () => {
  it('Should render group settings members', () => {
    const { group } = setup();
    render(
      <GroupSettingsMembers group={group} />
    );
    expect(screen.getByText('Group Admin')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('user3')).toBeInTheDocument();

    const checkbox1 = screen.getByText('user1').closest('tr').querySelector('input');
    const checkbox2 = screen.getByText('user2').closest('tr').querySelector('input');
    const checkbox3 = screen.getByText('user3').closest('tr').querySelector('input');
    expect(checkbox1.checked).toBe(true);
    expect(checkbox2.checked).toBe(false);
    expect(checkbox3.checked).toBe(true);
  });

});
