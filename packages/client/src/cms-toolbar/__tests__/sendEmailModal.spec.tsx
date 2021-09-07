import React from 'react';
import { render, screen } from 'test/test-utils';
import EmailForm, { SEND_MULTI_EMAIL, parseToSecond } from '../sendEmailModal';
import { MockedProvider } from 'react-apollo/test-utils';

describe('sendEmailModal.js', () => {
  describe('Component: EmailForm', () => {
    it('Render EmailForm properly', () => {
      const mocks = [
        {
          request: {
            query: SEND_MULTI_EMAIL,
            variables: {
              in: ['test'],
            },
          },
          result: { data: { status: 'success' } },
        },
      ];
      render(
        <MockedProvider mocks={mocks}>
          <EmailForm ids={['test']} />
        </MockedProvider>
      );
      expect(screen.queryByText('Send Email')).toBeInTheDocument();
    });
  });

  describe('parseToSecond', () => {
    it('should translate hour to second properly', () => {
      const expiresIn = {
        number: 24,
        unit: 'hours',
      };
      expect(parseToSecond(expiresIn)).toBe(24 * 60 * 60);
    });

    it('should translate minute to second properly', () => {
      const expiresIn = {
        number: 12,
        unit: 'minutes',
      };
      expect(parseToSecond(expiresIn)).toBe(12 * 60);
    });
  });
});
