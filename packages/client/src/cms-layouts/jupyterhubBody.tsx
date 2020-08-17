import * as React from 'react';
import { FormattedMessage, injectIntl } from "react-intl";
import {Props} from '../cms-components/types';
import IFrame from 'components/hub/iframe';

export default class JupyterhubBody extends React.Component<Props> {
  render() {
    return <div style={{height: 'calc(100vh - 64px)'}}>
      <IFrame src='/hub/admin' />
    </div>
  }
}
