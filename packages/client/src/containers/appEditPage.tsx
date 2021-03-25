import React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {get, unionBy, pick} from 'lodash';
import {notification} from 'antd';
import {compose} from 'recompose';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import {AppDetailProps, GET_PH_APPLICATION, getMessage} from 'containers/appDetail';
import {GET_APP_TEMPLATES, GET_MY_GROUPS, sortItems} from 'containers/appCreatePage';
import {PhApplicationFragment} from 'interfaces/phApplication';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import PageTitle from 'components/pageTitle';
import Breadcrumbs from 'components/share/breadcrumb';
import AppCreateForm from 'components/apps/createForm';

type AppEditProps = {
  updatePhApplication: any;
  getGroups: any;
} & AppDetailProps & GroupContextComponentProps;

export const UPDATE_PH_APPLICATION = gql`
  mutation updatePhApplication($where: PhApplicationWhereUniqueInput!, $data: PhApplicationUpdateInput!) {
    updatePhApplication(where: $where, data: $data) {
      ...PhApplicationInfo
    }
  }
  ${PhApplicationFragment}
`;

class AppEditPage extends React.Component<AppEditProps> {
  constructor(props) {
    super(props);
  }

  onSubmit = payload => {
    const {updatePhApplication} = this.props;
    updatePhApplication({
      variables: {
        where: {id: payload.id},
        data: pick(payload, ['instanceType', 'env'])
      }
    });
  }

  render() {
    const {getPhApplication, getPhAppTemplates, getGroups, groupContext, match} = this.props;
    const {params} = match;

    if (!getPhApplication.phApplication) return null;
    if (getPhApplication.error) {
      return getMessage(getPhApplication.error);
    }

    const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates') || [];
    const phApplication = get(getPhApplication, 'phApplication', {});
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []);
    const groups = allGroups
      .filter(g => g.id !== everyoneGroupId)
      .filter(g => !groupContext || groupContext.id === g.id);
    const everyoneGroup = allGroups.find(g => g.id === everyoneGroupId);
    const group = groups
      .find(g => g.id === groupContext.id);
    const instanceTypes = unionBy(
      get(group, 'instanceTypes', []),
      get(everyoneGroup, 'instanceTypes', []),
      'id'
    );

    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/apps/,
        title: 'Apps',
        link: '/apps?page=1'
      },
      {
        key: 'detail',
        matcher: /\/apps\/([\w-])+/,
        title: `App: ${get(getPhApplication, 'phApplication.displayName')}`,
        link: `/apps/${params.appId}`
      },
      {
        key: 'update',
        matcher: /\/apps\/([\w-])+\/edit/,
        title: 'Update App',
      }
    ];

    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Create App'}
        />
        <div style={{margin: '16px'}}>
          <AppCreateForm
            onSubmit={this.onSubmit}
            groupContext={groupContext}
            phAppTemplates={phAppTemplates}
            refetchGroup={getGroups.refetch}
            instanceTypes={sortItems(instanceTypes)}
            initialValue={phApplication}
            type='edit'
            loading={getGroups.loading || getPhApplication.loading || getPhAppTemplates.loading}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(GET_MY_GROUPS, {
    name: 'getGroups'
  }),
  graphql(GET_APP_TEMPLATES, {
    name: 'getPhAppTemplates'
  }),
  graphql(GET_PH_APPLICATION, {
    options: (props: AppDetailProps) => ({
      variables: {
        where: {
          id: props.match.params.appId
        }
      },
      fetchPolicy: 'cache-and-network',
    }),
    name: 'getPhApplication'
  }),
  graphql(UPDATE_PH_APPLICATION, {
    options: (props: AppEditProps) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        history.push(`../../apps`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              App updated.
              Click <a onClick={() => history.push(`apps/${data.updatePhApplication.id}`)}>here</a> to view detail.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'updatePhApplication'
  })
)(AppEditPage);
