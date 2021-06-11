import * as React from 'react';
import GroupSettingsInfo from '../info';
import { render, screen } from 'test/test-utils';

function setup() {
  const group = {
    name: 'test-group',
    displayName: 'Test Group',
    enabledSharedVolume: true,
    sharedVolumeCapacity: 120,
    quotaCpu: 1,
    quotaGpu: null,
    projectQuotaGpu: 2,
    projectQuotaMemory: 3,
  };

  return {
    group,
  };
}

describe('GroupSettingsInfo Component', () => {
  it('Should render group settings info', () => {
    const { group } = setup();
    render(
      <GroupSettingsInfo group={group} />
    );
    expect(screen.queryByText('Shared Volume Capacity')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test Group')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('120 GB')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('1.0')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('unlimited')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('2')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('3.0 GB')).toBeInTheDocument();
  });
});
