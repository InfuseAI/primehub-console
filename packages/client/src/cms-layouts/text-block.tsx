import React from 'react';
import {Item, Context} from 'canner-helpers';

export default ({
  title,
  description,

}) => {
  return (
    <div style={{
      marginTop: 24,
      marginBottom: 24
    }}>
      <div style={{
        marginBottom: 36
      }}>
        <h4>
          {title || null}
        </h4>
        <div>
          {description || null}
        </div>
      </div>
      <Item />
    </div>
  )
}