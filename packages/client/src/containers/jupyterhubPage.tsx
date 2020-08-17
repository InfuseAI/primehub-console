import * as React from 'react';
import {compose} from 'recompose';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import IFrame from 'components/hub/iframe';

type Props = GroupContextComponentProps;

class JupyterhubContainer extends React.Component<Props> {
  render() {
    const {groupContext} = this.props;

    return (
      groupContext && groupContext.name ?
      <IFrame src={`/hub/primehub/home?group=${groupContext.name}`} /> :
      <div />
    );
  }
}

export default compose(
  withGroupContext
)(JupyterhubContainer)
