import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from 'react-apollo/test-utils';
import { IntlProvider } from 'react-intl';

import { render, screen } from 'test/test-utils';

import { ImageAdd } from '../ImageAdd';

function setup() {
  function TestProvider({ children }: { children: React.ReactNode }) {
    return (
      <IntlProvider locale='en'>
        <MemoryRouter>{children}</MemoryRouter>
      </IntlProvider>
    );
  }

  return {
    TestProvider,
  };
}

beforeEach(() => {
  // @ts-ignore
  global.modelDeploymentOnly = false;
});

describe('ImageAdd', () => {
  it('should render create image by existing image form', () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider>
          <ImageAdd />
        </MockedProvider>
      </TestProvider>
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Container Image URL')).toBeInTheDocument();
    expect(screen.getByTestId('existing-one')).toBeChecked();
    expect(screen.getByText('Universal')).toBeInTheDocument();
    expect(screen.getByLabelText('Container Image URL')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Specific Container Image URL for GPU')
    ).toBeInTheDocument();
    expect(screen.getByText('Image Pull Secret')).toBeInTheDocument();
    expect(screen.getByTestId('global')).toBeChecked();
  });

  it('should render create image by custom image form', () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider>
          <ImageAdd />
        </MockedProvider>
      </TestProvider>
    );

    userEvent.click(screen.getByTestId('custom-image'));
    expect(screen.getByText('Base Image URL')).toBeInTheDocument();
    expect(screen.getByText('Image Pull Secret')).toBeInTheDocument();
    expect(screen.getByText('Package(s)')).toBeInTheDocument();
    expect(screen.getByText('APT')).toBeInTheDocument();
    expect(screen.getByText('Conda')).toBeInTheDocument();
    expect(screen.getByText('Pip')).toBeInTheDocument();
  });

  it('should render groups or not by toggle global option', () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider>
          <ImageAdd />
        </MockedProvider>
      </TestProvider>
    );

    expect(screen.queryByText('Groups')).toBeNull();

    const globalSwitch = screen.getByTestId('global');
    userEvent.click(globalSwitch);

    expect(screen.getByText('Groups')).toBeInTheDocument();
  });

  it('should not render specific container image url for cpu when type not eqaul to universal', async () => {
    const { TestProvider } = setup();

    render(
      <TestProvider>
        <MockedProvider>
          <ImageAdd />
        </MockedProvider>
      </TestProvider>
    );

    userEvent.click(screen.getByTestId('type'));
    const cpuOption = await screen.findByText('CPU');
    userEvent.click(cpuOption);

    expect(
      screen.queryByLabelText('Specific Container Image URL for GPU')
    ).toBeNull();
  });
});
