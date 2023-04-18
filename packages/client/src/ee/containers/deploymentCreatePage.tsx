import * as React from 'react';
import gql from 'graphql-tag';
import { notification } from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get, unionBy, pick } from 'lodash';
import queryString from 'querystring';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import { errorHandler } from 'utils/errorHandler';
import DeploymentCreateForm from 'ee/components/modelDeployment/createForm';
import PageTitle from 'components/pageTitle';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import { sortNameByAlphaBet } from 'utils/sorting';
import { CurrentUser } from 'queries/User.graphql';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/deployments/,
    title: 'Deployments',
    link: '/deployments?page=1'
  },
  {
    key: 'list',
    matcher: /\/deployments\/create/,
    title: 'Create Deployment',
    tips: 'Create a new deployment.',
    tipsLink: 'https://docs.primehub.io/docs/model-deployment-feature#create'
  }
];

export const CREATE_DEPLOYMENT = gql`
  mutation createPhDeployment($data: PhDeploymentCreateInput!) {
    createPhDeployment(data: $data) {
      id
    }
  }
`;

type Props = RouteComponentProps & GroupContextComponentProps & {
  currentUser: any;
  createPhDeployment: any;
  createPhDeploymentResult: any;
  licenseQuery: any;
};

type State = {
  selectedGroup: string | null;
};

class DeploymentCreatePage extends React.Component<Props, State> {
  state = {
    selectedGroup: null,
  };

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = payload => {
    const {createPhDeployment} = this.props;
    createPhDeployment({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {selectedGroup} = this.state;
    const {groupContext, currentUser, createPhDeploymentResult, location} = this.props;
    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const allGroups = get(currentUser, 'me.groups', []).filter(group => group.enabledDeployment || group.id === everyoneGroupId);
    const groups = allGroups
      .filter(group => group.id !== everyoneGroupId)
      .filter(group => !groupContext || groupContext.id === group.id );
    const everyoneGroup = allGroups.find(group => group.id === everyoneGroupId);
    const group = groups
      .find(group => group.id === selectedGroup);
    const instanceTypes = unionBy(
      get(group, 'instanceTypes', []),
      get(everyoneGroup, 'instanceTypes', []),
      'id'
    );
    const images = unionBy(
      get(group, 'images', []),
      get(everyoneGroup, 'images', []),
      'id'
    );
    const {defaultValue} = queryString.parse(location.search.replace(/^\?/, ''));
    let initValue = {}
    try {
      if (defaultValue) {
        initValue = JSON.parse(defaultValue as any);
        initValue = pick(initValue, ["modelURI"]);
      }
    } catch(e) {}

    const isReachedGroupDeploymentsLimit =
      group?.maxDeploy === null
        ? false
        : group?.deploymentsUsage >= group?.maxDeploy;
    const license = this.props.licenseQuery?.license;
    const isReachedSystemDeploymentsLimit =
      license?.maxModelDeploy === -1
        ? false
        : license?.usage.maxModelDeploy >= license?.maxModelDeploy;

    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Create Deployment'}
        />

        <div style={{ margin: '16px' }}>
          <DeploymentCreateForm
            type="create"
            groupContext={groupContext}
            refetchGroup={currentUser.refetch}
            onSelectGroup={this.onChangeGroup}
            selectedGroup={selectedGroup}
            groups={sortNameByAlphaBet(groups)}
            instanceTypes={sortNameByAlphaBet(instanceTypes)}
            images={sortNameByAlphaBet(images)}
            initialValue={initValue}
            onSubmit={this.onSubmit}
            loading={currentUser.loading || createPhDeploymentResult.loading}
            isReachedGroupDeploymentsLimit={isReachedGroupDeploymentsLimit}
            isReachedSystemDeploymentsLimit={isReachedSystemDeploymentsLimit}
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
    alias: 'withCurrentUser',
    name: 'currentUser',
  }),
  graphql(
    gql`
      query {
        license {
          maxModelDeploy
          usage {
            maxModelDeploy
          }
        }
      }
    `,
    {
      name: 'licenseQuery',
    }
  ),
  graphql(CREATE_DEPLOYMENT, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const { history } = props;
        history.push({
          pathname: `../deployments`,
        });
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Your model has begun deploying. Click{' '}
              <a
                onClick={() =>
                  history.push(`deployments/${data.createPhDeployment.id}`)
                }
              >
                here
              </a>{' '}
              to view.
            </>
          ),
        });
      },
      onError: errorHandler,
    }),
    name: 'createPhDeployment',
  })
)(DeploymentCreatePage);
