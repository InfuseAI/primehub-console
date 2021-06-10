import * as React from 'react';

import { IFrame } from 'components/hub/iframe';

function JupyterhubBody() {
  return (
    <div style={{ height: 'calc(100vh - 64px)' }}>
      <IFrame src="/hub/admin" />
    </div>
  );
}

export default JupyterhubBody;
