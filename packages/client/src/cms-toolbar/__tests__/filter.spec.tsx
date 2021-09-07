import React from 'react';
import { IntlProvider } from 'react-intl';
import { render, screen } from 'test/test-utils';
import FilterGroup from '../filter';

describe('cms-toolbar > filter', () => {
  it('FilterGroup should render properly', () => {
    const props = {
      where: {},
      fields: [
        {
          type: 'text',
          label: 'Username',
          key: 'username',
        },
        {
          type: 'text',
          label: 'Email',
          key: 'email',
        },
      ],
    };
    render(
      <IntlProvider locale='en'>
        <FilterGroup {...props} />
      </IntlProvider>
    );

    expect(screen.queryByText('Username')).toBeInTheDocument();
    expect(screen.queryByText('Email')).toBeInTheDocument();
  });
});
