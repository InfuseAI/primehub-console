import * as React from 'react';
import {Item} from 'canner-helpers';

export default () => {
  return (
    <Item disabled={(window as any).disableMode || false}/>
  )
}