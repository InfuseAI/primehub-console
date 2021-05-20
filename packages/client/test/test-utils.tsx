import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>
) => {
  // TODO: add `wrapper`
  return render(ui, { /** wrapper: <> */ ...options });
};

export * from '@testing-library/react';

export { customRender as render };
