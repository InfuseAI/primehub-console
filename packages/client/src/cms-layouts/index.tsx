import * as React from 'react';
import {Item} from 'canner-helpers';
import PHTooltip from 'components/share/toolTip';
import styled from 'styled-components';

const LabelSpan = styled.span`
  color: rgba(0, 0, 0, 0.85);
`;

export const GenTipsLabel = (labelName, tipText, tipLink, placement = 'right') => {
  return () => {
    return (
      <div>
        <LabelSpan>{labelName} <PHTooltip tipText={tipText} tipLink={tipLink} placement={placement}/></LabelSpan>
        <Item/>
      </div>
    );
  };
};
