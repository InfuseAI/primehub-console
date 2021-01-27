import React from 'react'
import { compose } from 'recompose';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { withAccessToken} from 'components/helpers/withAccessToken';
import { GroupContextComponentProps, withGroupContext} from 'context/group';
import {withRouter} from 'react-router-dom';
import Browser from './browser';

const breadcrumbs = [
  {
    key: 'browse',
    matcher: /\/browse/,
    title: 'Shared Files',
    link: '/browse'
  }
];


interface Props extends GroupContextComponentProps {

}

interface State {
  path: string
}

class ShareFilesPage extends React.Component<Props, State> {

  state = {
    path: '/'
  }

  onPathChanged (newPath) {
    this.setState({path: newPath});
  }

  render () {
    const {groupContext} =this.props;
    const {path} = this.state;
    return <div>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Shared Files"}
      />
      <PageBody>
        <Browser
          path={path}
          groupName={groupContext.name}
          onPathChanged={(newPath)=>{this.onPathChanged(newPath)}}
        />
      </PageBody>
    </div>
  }
}

export default compose(
  withAccessToken,
  withGroupContext,
  withRouter
)(ShareFilesPage);
