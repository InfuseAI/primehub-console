import React from 'react';
import { IFrame } from 'components/hub/iframe';

export default function JupyterhubAdmin() {
  return (
    <div style={{ height: 'calc(100vh - 64px)' }}>
      <IFrame src='/hub/admin' />
    </div>
  );
}
