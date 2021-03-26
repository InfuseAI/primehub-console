import * as React from 'react';
import {notification} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import AppCreateForm from 'components/apps/createForm';
import {GroupContextComponentProps, withGroupContext } from 'context/group';
import PageTitle from 'components/pageTitle';
import Breadcrumbs from 'components/share/breadcrumb';
import {GetPhAppTemplates} from 'queries/PhAppTemplate.graphql';
import {CreatePhApplication} from 'queries/PhApplication.graphql';
import {CurrentUser} from 'queries/User.graphql';

let breadcrumbs = [
  {
    key: 'list',
    matcher: /\/apps/,
    title: 'Apps',
    link: '/apps?page=1'
  },
  {
    key: 'create',
    matcher: /\/apps\/create/,
    title: 'Add App to PrimeHub'
  }
];

const compareByAlphabetical = (prev, next) => {
  if (prev < next) return -1;
  if (prev > next) return 1;
  return 0;
};

export const sortItems = items => {
  const copiedItems = items.slice();
  copiedItems
    .sort((prev, next) => {
      const prevName = prev.displayName || prev.name;
      const nextName = next.displayName || next.name;
      return compareByAlphabetical(prevName, nextName);
    });
  return copiedItems;
};

type Props = RouteComponentProps<{
  templateId: string;
}> & GroupContextComponentProps & {
  currentUser: any;
  getPhAppTemplates: any;
  createPhApplication: any;
  createPhApplicationResult: any;
};

interface State {
  selectedGroup: string | null;
}

class AppCreatePage extends React.Component<Props, State> {
  state = {
    selectedGroup: null,
  };

  onSubmit = payload => {
    const {createPhApplication} = this.props;
    createPhApplication({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {groupContext, currentUser, getPhAppTemplates, createPhApplicationResult, match} = this.props;
    const {params} = match;
    const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates') || [];
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
    const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';
    if (params.templateId) {
      breadcrumbs = [
        {
          key: 'list',
          matcher: /\/apps/,
          title: 'Apps',
          link: '/apps?page=1'
        },
        {
          key: 'store',
          matcher: /\/apps/,
          title: 'Store',
          link: '/apps/store'
        },
        {
          key: 'create',
          matcher: /\/apps\/create/,
          title: 'Add App to PrimeHub'
        }
      ];
    }

    if (!getPhAppTemplates.phAppTemplates) return null;
    if (getPhAppTemplates.error) {
      return getMessage(getPhAppTemplates.error);
    }

    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Create App'}
        />
        <div style={{margin: '16px'}}>
          <AppCreateForm
            templateId={params.templateId}
            groupContext={groupContext}
            phAppTemplates={phAppTemplates}
            refetchGroup={currentUser.refetch}
            instanceTypes={sortItems(instanceTypes)}
            onSubmit={this.onSubmit}
            loading={currentUser.loading || createPhApplicationResult.loading}
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
    name: 'currentUser',
    alias: 'withCurrentUser'
  }),
  graphql(GetPhAppTemplates, {
    name: 'getPhAppTemplates',
    alias: 'withPhAppTemplates',
  }),
  graphql(CreatePhApplication, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        history.push({
          pathname: `../../apps`,
          search: queryString.stringify({first: 8})
        });
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Your app is creating.
              Click <a onClick={() => history.push(`apps/${data.createPhApplication.id}`)}>here</a> to view details.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'createPhApplication',
    alias: 'withCreatePhApplication',
  })
)(AppCreatePage);
