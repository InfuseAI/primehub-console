import * as React from 'react';
import {Item} from 'canner-helpers';
import PHTooltip from 'components/share/toolTip';

export default () => {
  if (window.enableModelDeployment) {
    return (
      <div>
        <span style={{color: 'rgba(0, 0, 0, 0.85)'}}>Model Deployment <PHTooltip tipText='Groups with enabled model deployment are able to deploy/serve models.' tipLink='https://docs.primehub.io/docs/guide_manual/admin-group#model-deployment' placement='right'/></span>
        <Item />
      </div>
    );
  }
  return null;
}
