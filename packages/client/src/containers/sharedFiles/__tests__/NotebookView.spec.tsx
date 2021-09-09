import * as React from 'react';
import { render, screen } from 'test/test-utils';
import NotebookViewer from '../NotebookView';

describe('Share Page', () => {
  const { location } = window;
  const getHrefSpy = jest.fn(() => 'http://example.primehub.io/share/hash-id');
  const setHrefSpy = jest.fn(href => href);

  beforeAll(() => {
    delete window.location;
    window.location = {};
    Object.defineProperty(window.location, 'href', {
      get: getHrefSpy,
      set: setHrefSpy,
    });
    window.absGraphqlEndpoint = 'http://download.primehub.io/graphql';
  });

  it('Render public url to download url', async () => {
    render(<NotebookViewer />);
    expect(await screen.findByTestId('download-url')).toHaveAttribute(
      'href',
      'http://download.primehub.io/share/hash-id?download=1'
    );
  });

  afterAll(() => {
    window.location = location;
    delete window.absGraphqlEndpoint;
  });
});
