import React from 'react';
import { render, screen } from 'test/test-utils';
import Logs from '../log';

describe('Log util', () => {
  it('Render Log util properly', () => {
    render(<Logs />);
    expect(
      screen.queryByText(
        'Please download the log to view more than 2000 lines.'
      )
    ).toBeInTheDocument();
  });
});
