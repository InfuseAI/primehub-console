import React from 'react'
import { compose } from 'recompose';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { GroupContextComponentProps, withGroupContext} from 'context/group';
import {withRouter} from 'react-router-dom';
import Browser from './browser';
import { appPrefix } from 'utils/env';
import { RouteComponentProps } from 'react-router';

const breadcrumbs = [
  {
    key: 'browse',
    matcher: /\/browse/,
    title: 'Shared Files',
    link: '/browse'
  }
];


interface Props extends GroupContextComponentProps, RouteComponentProps {

}

class ShareFilesPage extends React.Component<Props> {

  onPathChanged (newPath) {
    const {history, groupContext} = this.props;
    history.push(`${appPrefix}g/${groupContext.name}/browse${newPath}` )
  }

  render () {
    const {groupContext, match} =this.props;
    let path:string = (match.params as any).phfsPrefix || '';

    if (! path.startsWith('/')) {
      path = '/' + path;
    }

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
  withGroupContext,
  withRouter
)(ShareFilesPage);
