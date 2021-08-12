import * as React from 'react';
import {Item} from 'canner-helpers';

export default () => {
  return (
    <Item hidden={!(window.enableUploadServer)}/>
  )
}
