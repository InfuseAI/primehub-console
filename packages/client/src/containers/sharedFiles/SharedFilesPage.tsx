import React from 'react'
import { compose } from 'recompose';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { GroupContextComponentProps, withGroupContext} from 'context/group';
import {withRouter} from 'react-router-dom';
import Browser from './browser';
import NextBrowser from './NextBrowse';
import { appPrefix } from 'utils/env';
import { RouteComponentProps } from 'react-router';

const breadcrumbs = [
  {
    key: 'browse',
    matcher: /\/browse/,
    title: 'Shared Files',
    link: '/browse',
    tips: 'Users can share files in this PHFS storage with group members.',
    tipsLink: 'https://docs.primehub.io/docs/shared-files'
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
        <NextBrowser path={path} />
      </PageBody>
    </div>
  }
}

export default compose(
  withGroupContext,
  withRouter
)(ShareFilesPage);
