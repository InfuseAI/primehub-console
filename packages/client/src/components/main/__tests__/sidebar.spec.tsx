import * as React from 'react';
import { Sidebar } from '../sidebar';
import { render, screen } from 'test/test-utils';
import { MainPageSidebarItem } from 'containers/mainPage';
import { MemoryRouter } from 'react-router-dom';

function setup() {
  const sidebarItems: MainPageSidebarItem[] = [
    {
      title: 'Notebooks',
      subPath: 'hub',
      icon: '',
    },
    {
      title: 'Setting',
      subPath: 'settings',
      icon: '',
      groupAdminOnly: true,
    },
  ];

  const userContext = {
    id: '1',
    username: 'test',
    isCurrentGroupAdmin: false,
  };

  const routeComponentPropsMock = {
    history: {
      location: {
        pathname: '/g/test-group/home',
      },
    } as any,
    location: {} as any,
    match: {
      params: {
        groupName: 'test-group',
      },
    } as any,
  };

  return {
    sidebarItems,
    userContext,
    routeComponentPropsMock,
  };
}

describe('Sidebar Component', () => {
  it('Should render sidebar w/ sidebarItems.', () => {
    const { sidebarItems, userContext, routeComponentPropsMock } = setup();
    render(
      <MemoryRouter>
        <Sidebar
          {...routeComponentPropsMock}
          sidebarItems={sidebarItems}
          userContext={userContext}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('Notebooks')).toBeInTheDocument();
    expect(screen.queryByText('Setting')).not.toBeInTheDocument();
  });

  it('Should render admin items if user is groupAdmin', () => {
    const { sidebarItems, userContext, routeComponentPropsMock } = setup();
    userContext.isCurrentGroupAdmin = true;
    render(
      <MemoryRouter>
        <Sidebar
          {...routeComponentPropsMock}
          sidebarItems={sidebarItems}
          userContext={userContext}
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('Setting')).toBeInTheDocument();
  });
});
