import React from 'react';
import { render, screen } from 'test/test-utils';
import Expires from '../customize-number-expires';

describe('Customize Number Expires', () => {
  it('Should render Expires in hours component properly', () => {
    render(<Expires value={24 * 60 * 60} />);
    expect(screen.queryByTestId('expires-in-input').getAttribute('value')).toBe(
      '24'
    );
    expect(screen.queryByText('Hours')).toBeInTheDocument();
    expect(screen.queryByText('Minutes')).not.toBeInTheDocument();
  });

  it('Should render Expires in hours component properly', () => {
    render(<Expires value={12 * 60} />);
    expect(screen.queryByTestId('expires-in-input').getAttribute('value')).toBe(
      '12'
    );
    expect(screen.queryByText('Hours')).not.toBeInTheDocument();
    expect(screen.queryByText('Minutes')).toBeInTheDocument();
  });
});
