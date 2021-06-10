import * as React from 'react';
import GroupSettingsJobs from '../jobs';
import { render, screen } from 'test/test-utils';
import { MockedProvider } from 'react-apollo/test-utils';

function setup() {
  const group = {
    id: 'test-group',
    name: 'test-group',
    displayName: 'Test Group',
    admins: 'test',
    jobDefaultActiveDeadlineSeconds: 3360,
  };

  const user = {
    id: '1',
    username: 'test',
    isCurrentGroupAdmin: true,
  };

  const currentUser = {
    me: {
      groups: [ group ],
    },
  };

  return {
    group,
    user,
    currentUser,
  };
}

describe('GroupSettingsJobs Component', () => {
  it('Should render group settings jobs', () => {
    const { group, user, currentUser } = setup();
    const { container } = render(
      <MockedProvider>
        <GroupSettingsJobs currentUser={currentUser} groupContext={group} userContext={user} />
      </MockedProvider>
    );
    expect(screen.queryByText('Default Timeout Setting')).toBeInTheDocument();
    // 3360 seconds = 56 minutes
    expect(screen.queryByDisplayValue('56')).toBeInTheDocument();
  });
});
