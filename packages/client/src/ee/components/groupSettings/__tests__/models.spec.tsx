import * as React from 'react';
import GroupSettingsDeployments from '../deployments';
import { render, screen } from 'test/test-utils';
import { MockedProvider } from 'react-apollo/test-utils';

function setup() {
  const group = {
    id: 'test-group',
    name: 'test-group',
    displayName: 'Test Group',
    admins: 'test',
    enabledDeployment: true,
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

describe('GroupSettingsDeployments Component', () => {
  it('Should render group settings models', () => {
    const { group, user, currentUser } = setup();
    render(
      <MockedProvider>
        <GroupSettingsDeployments currentUser={currentUser} groupContext={group} userContext={user} />
      </MockedProvider>
    );
    expect(screen.queryByText('Model Deployment')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
  });
});
