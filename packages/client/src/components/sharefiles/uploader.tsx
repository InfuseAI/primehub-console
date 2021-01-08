import React from 'react'
import { compose } from 'recompose';
import queryString from 'querystring';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import { Alert } from 'antd';
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import { Dashboard } from '@uppy/react'
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { withAccessToken, AccessTokenComponentProps } from 'components/helpers/withAccessToken';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import {withRouter, Link} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import { GET_MY_GROUPS, GroupFragment } from 'containers/list';
import { get } from 'lodash';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

type Props = RouteComponentProps & AccessTokenComponentProps & GroupContextComponentProps & {
  getMyGroups: any;
};

const breadcrumbs = [
  {
    key: 'browse',
    matcher: /\/browse/,
    title: 'Shared Files',
    link: '/browse'
  }
];

const ShareFilesUploader = (props: Props) => {
  const { accessToken, groupContext, getMyGroups } = props;
  const endpoint = `${(window as any).cmsHost}${(window as any).graphqlPrefix}/tus`;
  const dirpath = `groups/${groupContext.name}/upload`;
  const headers = {
    authorization: `Bearer ${accessToken}`
  };
  const uppy = Uppy({
    autoProceed: true
  });
  const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
  if (getMyGroups.loading) return null;
  if (getMyGroups.error) return 'Error';

  const groups = get(getMyGroups, 'me.groups', [])
    .filter(group => group.id !== everyoneGroupId);

  uppy
    .use(Tus, {
      endpoint,
      headers
    })
    .setMeta({dirpath});

  uppy
    .on('complete', (result) => {
      const url = result.successful[0].uploadURL
      console.log('Upload compelete!', url, result.successful);
    });
  if ( groupContext ) {
    const group = groups.find(group => group.id === groupContext.id);
    if ( !group ) {
      return (<Alert
        message="Group not found"
        description={`Group ${groupContext.name} is not found or not authorized.`}
        type="error"
        showIcon/>);
    } else if ( window.enablePhfs !== true ) {
      return (<Alert
        message="Feature not available"
        description="PrimeHub File System is not enabled for selected group. Please contact your administrator to enable this feature."
        type="warning"
        showIcon/>);
    }
  }
  return (
    <div>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={"Share Files"}
      />
      <PageBody>
        <div style={
          {
            width: 850,
            margin: "auto"
          }
        }>
          <div
            style={
              {
                margin: "10px",
                textAlign: "center"
              }
            }
          >
            <span>Upload files to your group's PrimeHub File System. Files uploaded in this group are shared at phfs/uploads.</span>
          </div>
          {/*
           //@ts-ignore */}
          <Dashboard
            inline={true}
            width={850}
            uppy={uppy}
          />
        </div>
      </PageBody>
    </div>
  )
}

export default compose(
  withAccessToken,
  withGroupContext,
  withRouter,
  graphql(GET_MY_GROUPS, {
    name: 'getMyGroups',
    options: (props: Props) => ({
      onCompleted: data => {
        // default  page=1
        if (props.location.search) return;
        props.history.replace({
          pathname: props.location.pathname,
          search: queryString.stringify({page: 1})
        });
      },
      fetchPolicy: 'cache-and-network'
    }),
  })
)(ShareFilesUploader);
