import React from 'react';
import { render, screen } from 'test/test-utils';
import { Route, MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';
import GroupUpdate from '../GroupAdd';
import { IntlProvider } from 'react-intl';

describe('Admin Portal - Group Update', () => {
  const wrapper = ({ children }) => {
    return (
      <IntlProvider locale={'en'}>
        <MemoryRouter initialEntries={['/group/update']}>
          <Route path='/group/update'>{children}</Route>
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
        <GroupUpdate />
      </MockedProvider>,
      { wrapper }
    );
    expect(screen.queryByText('Info')).toBeInTheDocument();
  });
});
