import * as React from 'react';

interface Props {
  src: string;
}

export function IFrame({ src }: Props) {
  return (
    <div data-testid={name} style={{ width: '100%', height: '100%' }}>
      <iframe
        data-testid="iframe-component"
        src={src}
        width="100%"
        height="100%"
        style={{ overflow: 'hidden' }}
        scrolling="auto"
        frameBorder="0"
      />
    </div>
  );
}
