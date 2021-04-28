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
import DeploymentCreateForm from 'ee/components/modelDeployment/createForm';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';
import {GroupContextComponentProps, withGroupContext} from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {sortNameByAlphaBet} from 'utils/sorting';
import {CurrentUser} from 'queries/User.graphql';

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
    title: 'Create Deployment'
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
    const {groupContext, currentUser, createPhDeploymentResult, history} = this.props;
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
    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Create Deployment'}
        />
        <div style={{margin: '16px'}}>
          <DeploymentCreateForm
            groupContext={groupContext}
            refetchGroup={currentUser.refetch}
            onSelectGroup={this.onChangeGroup}
            selectedGroup={selectedGroup}
            groups={sortNameByAlphaBet(groups)}
            instanceTypes={sortNameByAlphaBet(instanceTypes)}
            images={sortNameByAlphaBet(images)}
            onSubmit={this.onSubmit}
            loading={currentUser.loading || createPhDeploymentResult.loading}
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
    name: 'currentUser'
  }),
  graphql(CREATE_DEPLOYMENT, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        history.push({
          pathname: `../deployments`,
          search: queryString.stringify({first: 8})
        });
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Your model has begun deploying.
              Click <a onClick={() => history.push(`deployments/${data.createPhDeployment.id}`)}>here</a> to view.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'createPhDeployment'
  })
)(DeploymentCreatePage)
