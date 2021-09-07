import React from 'react';
import { render } from 'test/test-utils';
import Chart from 'chart.js';
import LineChart from '../lineChart';
jest.genMockFromModule('chart.js');
jest.mock('chart.js');

describe('LineChart', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Render LineChart properly', () => {
    const fakeObj = {};
    const spyFill = jest.fn();
    Object.defineProperty(fakeObj, 'fill', {
      get: jest.fn(() => undefined),
      set: spyFill,
    });
    Chart.mockImplementation(() => 'test');
    const { container } = render(
      <LineChart
        title='Test Chart'
        datasets={[fakeObj]}
        labels={['Test Label']}
      />
    );
    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(Chart).toHaveBeenCalledTimes(1);
    expect(spyFill).toHaveBeenCalledWith(false);
  });
});
