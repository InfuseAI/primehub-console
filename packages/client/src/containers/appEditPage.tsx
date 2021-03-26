import React from 'react';
import {graphql} from 'react-apollo';
import {get, unionBy, pick} from 'lodash';
import {notification} from 'antd';
import {compose} from 'recompose';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import {AppDetailProps, getMessage} from 'containers/appDetail';
import {sortItems} from 'containers/appCreatePage';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import PageTitle from 'components/pageTitle';
import Breadcrumbs from 'components/share/breadcrumb';
import AppCreateForm from 'components/apps/createForm';
import {CurrentUser} from 'queries/User.graphql';
import {GetPhAppTemplates} from 'queries/PhAppTemplate.graphql';
import {UpdatePhApplication, GetPhApplication} from 'queries/PhApplication.graphql';

type AppEditProps = {
  updatePhApplication: any;
  currentUser: any;
} & AppDetailProps & GroupContextComponentProps;

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
    const {getPhApplication, getPhAppTemplates, currentUser, groupContext, match} = this.props;
    const {params} = match;

    if (!getPhApplication.phApplication) return null;
    if (getPhApplication.error) {
      return getMessage(getPhApplication.error);
    }

    const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates') || [];
    const phApplication = get(getPhApplication, 'phApplication', {});
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(currentUser, 'me.groups', []);
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
            refetchGroup={currentUser.refetch}
            instanceTypes={sortItems(instanceTypes)}
            initialValue={phApplication}
            type='edit'
            loading={currentUser.loading || getPhApplication.loading || getPhAppTemplates.loading}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(CurrentUser, {
    name: 'currentUser'
  }),
  graphql(GetPhAppTemplates, {
    name: 'getPhAppTemplates'
  }),
  graphql(GetPhApplication, {
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
  graphql(UpdatePhApplication, {
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
