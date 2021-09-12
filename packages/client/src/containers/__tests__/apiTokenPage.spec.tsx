import * as React from 'react';
import { findByAltText, render, screen, waitFor } from 'test/test-utils';
import { MemoryRouter } from 'react-router-dom';
import ApiTokenPage from 'containers/apiTokenPage';
import { GroupContext } from 'context/group';
import { UserContext } from 'context/user';
import { MockedProvider } from 'react-apollo/test-utils';
import { GetApiTokenCount, RevokeApiToken, DELETE_DOG_MUTATION } from 'queries/ApiToken.graphql';
import userEvent from '@testing-library/user-event';

const mockRequests = [
  {
    request: {
      query: GetApiTokenCount,
    },
    result: {
      data: {
        me: {
          apiTokenCount: 1,
          __typename: 'User',
        },
      },
    },
  },
  {
    request: {
      query: RevokeApiToken,
    },
    result: {
      data: {
        revokeApiToken: {
          id: 'user-id',
          __typename: 'UserActionResponse',
        },
      },
    },
  },
];

const AllTheProviders = ({ children }) => {
  const groupValue = {
    id: 'test-group',
    name: 'test-group',
    displayName: 'test-group',
    admins: 'test',
    enabledSharedVolume: true,
    enabledDeployment: true,
  };

  const userValue = {
    id: '1',
    username: 'test',
    isCurrentGroupAdmin: true,
  };

  return (
    <MockedProvider>
      <GroupContext.Provider value={groupValue}>
        <UserContext.Provider value={userValue}>
          <MockedProvider mocks={mockRequests}>
            <MemoryRouter>{children}</MemoryRouter>
          </MockedProvider>
        </UserContext.Provider>
      </GroupContext.Provider>
    </MockedProvider>
  );
};

describe('ApiToken page Container', () => {
  it('Should render apiToken page properly', () => {
    render(<ApiTokenPage />, { wrapper: AllTheProviders });
    expect(screen.queryByText('Request API Token')).toBeInTheDocument();
  });

  it('Should apiToken render current apiToken when window.apiToken exists.', () => {
    const testApiToken = 'test-api-token';
    // @ts-ignore
    global.apiToken = testApiToken;
    render(<ApiTokenPage />, { wrapper: AllTheProviders });
    expect(screen.queryByDisplayValue(testApiToken)).toContainHTML('<Input readOnly');
  });

  it('Should go to requestApiTokenEndpoint when click the request button', async () => {
    // @ts-ignore
    global.requestApiTokenEndpoint = '/console/oidc/request-api-token';
    // @ts-ignore
    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://dummy.com/console/g/phusers/api-token',
        pathname: '/console/g/phusers/api-token',
      },
      writable: true,
    });
    render(<ApiTokenPage />, { wrapper: AllTheProviders });
    await userEvent.click(screen.getByTestId('request-button'));
    await screen.findByText('Are you sure you want to request an API token?');
    const okButton = screen.getByText('OK');
    await userEvent.click(okButton);
    await waitFor(() =>
      expect(window.location.href).toEqual(
        '/console/oidc/request-api-token?backUrl=%2Fconsole%2Fg%2Fphusers%2Fapi-token'
      )
    );
  });

  it('Should copy the config file', async () => {
    const testApiToken = 'test-api-token';
    const graphqlEndpoint = 'https://dummy.com/console/g/phusers/api-token';

    // @ts-ignore
    global.absGraphqlEndpoint = graphqlEndpoint;
    // @ts-ignore
    global.apiToken = testApiToken;

    const promise = new Promise(downloadConfig => {
      render(<ApiTokenPage downloadConfig={downloadConfig} />, {
        wrapper: AllTheProviders,
      });
    });

    await userEvent.click(screen.getByTestId('download-button'));
    const result: any = await promise;
    expect(result.endpoint).toEqual(graphqlEndpoint);
    expect(result['api-token']).toEqual(testApiToken);
  });
});
