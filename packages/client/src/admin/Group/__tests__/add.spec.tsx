import React from 'react';
import { render, screen } from 'test/test-utils';
import { Route, MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';
import GroupAdd from '../GroupAdd';
import { IntlProvider } from 'react-intl';

describe('Admin Portal - Group Add', () => {
  const wrapper = ({ children }) => {
    return (
      <IntlProvider locale={'en'}>
        <MemoryRouter initialEntries={['/group/add']}>
          <Route path='/group/add'>{children}</Route>
        </MemoryRouter>
      </IntlProvider>
    );
  };
  beforeEach(() => {
    // @ts-ignore
    global.modelDeploymentOnly = false;
    // @ts-ignore
    global.__ENV__ = 'ee';
  });

  it('Render Group list with breadcrumb', () => {
    render(
      <MockedProvider mocks={[]}>
        <GroupAdd />
      </MockedProvider>,
      { wrapper }
    );
    expect(screen.queryByText('Add Group')).toBeInTheDocument();
  });
});
