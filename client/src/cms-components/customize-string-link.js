// @flow
import React, { PureComponent } from "react";
import InputString from "@canner/antd-string-input";
import defaultMessage from "@canner/antd-locales";
import { FormattedMessage } from "react-intl";
import styled from 'styled-components';
import get from 'lodash/get';

// types

const PreviewContainer = styled.div`
  margin: 10px 0;
`

export default class LinkString extends PureComponent {
  render() {
    const { value, onChange, refId, disabled, uiParams, rootValue, title } = this.props;
    const recordValue = getRecordValue(rootValue, refId);
    // hack
    const isHidden = uiParams.isHidden ? uiParams.isHidden(recordValue) : false;
    if (isHidden) {
      return null;
    }
    return (
      <div>
        {
          uiParams.isHidden && <div style={{marginTop: 16, fontSize: 18}}>{title}</div>
        }
        <InputString refId={refId} value={value} onChange={onChange} disabled={disabled}/>
        {value && (
          <PreviewContainer>
            <FormattedMessage
              id="string.link.preview"
              defaultMessage={defaultMessage.en["string.link.preview"]}
            />
            <a href={value} target="_blank">
              {value}
            </a>
          </PreviewContainer>
        )}
      </div>
    );
  }
}

function getRecordValue(rootValue, refId) {
  const targetRefId = refId.remove();
  return get(rootValue, targetRefId.getPathArr());
}
