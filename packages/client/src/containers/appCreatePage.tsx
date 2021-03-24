import * as React from 'react';
import gql from 'graphql-tag';
import {notification} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import AppCreateForm from 'components/apps/createForm';
import {GroupFragment} from 'containers/list';
import {appPrefix} from 'utils/env';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import PageTitle from 'components/pageTitle';
import Breadcrumbs from 'components/share/breadcrumb';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/apps/,
    title: 'Apps',
    link: '/apps?page=1'
  },
  {
    key: 'create',
    matcher: /\/apps\/create/,
    title: 'Create Apps'
  }
];

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
        instanceTypes { id name displayName description spec global gpuLimit memoryLimit cpuLimit }
      }
    }
  }
  ${GroupFragment}
`;

export const GET_APP_TEMPLATES = gql`
  query phAppTemplates {
    phAppTemplates {
      id
      defaultEnv
      name
      icon
      version
      description
      docLink
    }
  }
`;

export const CREATE_APPLICATION = gql`
  mutation createPhApplication($data: PhApplicationCreateInput!) {
    createPhApplication(data: $data) {
      id
    }
  }
`;

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

type Props = RouteComponentProps & GroupContextComponentProps & {
  getGroups: any;
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
    const {groupContext, getGroups, getPhAppTemplates, createPhApplicationResult, history} = this.props;
    const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates') || [];
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

    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Create App'}
        />
        <div style={{margin: '16px'}}>
          <AppCreateForm
            groupContext={groupContext}
            phAppTemplates={phAppTemplates}
            refetchGroup={getGroups.refetch}
            instanceTypes={sortItems(instanceTypes)}
            onSubmit={this.onSubmit}
            loading={getGroups.loading || createPhApplicationResult.loading}
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
  graphql(CREATE_APPLICATION, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        history.push({
          pathname: `../apps`,
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
    name: 'createPhApplication'
  })
)(AppCreatePage);
