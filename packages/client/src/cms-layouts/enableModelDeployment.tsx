import * as React from 'react';
import {Item} from 'canner-helpers';

export default () => {
  if ((window as any).enableModelDeployment) return<Item />
  return null;
}
