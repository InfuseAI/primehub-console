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


  it('Render Group list with breadcrumb', () => {

    // @ts-ignore
    global.modelDeploymentOnly = false;
    // @ts-ignore
    global.__ENV__ = 'ee';

    render(
      <MockedProvider mocks={[]}>
        <GroupUpdate />
      </MockedProvider>,
      { wrapper }
    );
    expect(screen.queryByText('Info')).toBeInTheDocument();
    expect(screen.queryByText('Model Deployment')).toBeInTheDocument();
  });

  it('Render ce-related settings in group settings', () => {
    global.__ENV__ = 'ce';
    render(
      <MockedProvider mocks={[]}>
        <GroupUpdate />
      </MockedProvider>,
      { wrapper }
    );
    expect(screen.queryByText('Shared Volume')).toBeInTheDocument();
    expect(screen.queryByText('Model Deployment')).not.toBeInTheDocument();
  });

  it('Render ee-related settings in group settings', () => {
    global.__ENV__ = 'ee';
    render(
      <MockedProvider mocks={[]}>
        <GroupUpdate />
      </MockedProvider>,
      { wrapper }
    );
    expect(screen.queryByText('Shared Volume')).toBeInTheDocument();
    expect(screen.queryByText('Model Deployment')).toBeInTheDocument();
  });

  it('Render deploy-related settings in group settings', () => {
    global.__ENV__ = 'modelDeploy';
    render(
      <MockedProvider mocks={[]}>
        <GroupUpdate />
      </MockedProvider>,
      { wrapper }
    );
    expect(screen.queryByText('Shared Volume')).not.toBeInTheDocument();
    expect(screen.queryByText('Model Deployment')).not.toBeInTheDocument();
  });
});
