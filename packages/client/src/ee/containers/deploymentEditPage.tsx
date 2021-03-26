import * as React from 'react';
import gql from 'graphql-tag';
import {Icon, notification, Modal} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy, isEqual, pick} from 'lodash';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import DeploymentCreateForm from 'ee/components/modelDeployment/createForm';
import PageTitle from 'components/pageTitle';
import {PhDeploymentFragment} from 'ee/components/modelDeployment/common';
import {GET_PH_DEPLOYMENT, getMessage} from 'ee/containers/deploymentDetail';
import {GET_MY_GROUPS} from './deploymentCreatePage';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';

export const UPDATE_DEPLOYMENT = gql`
  mutation updatePhDeployment($where: PhDeploymentWhereUniqueInput!, $data: PhDeploymentUpdateInput!) {
    updatePhDeployment(where: $where, data: $data) {
      ...PhDeploymentInfo
    }
  }
  ${PhDeploymentFragment}
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

type Props = RouteComponentProps<{deploymentId: string}> & GroupContextComponentProps & {
  getGroups: any;
  refetchGroup: any;
  updatePhDeployment: any;
  updatePhDeploymentResult: any;
  getPhDeployment: any;
};

type State = {
  selectedGroup: string | null;
};

class DeploymentCreatePage extends React.Component<Props, State> {
  onSubmit = payload => {
    const {updatePhDeployment} = this.props;
    updatePhDeployment({
      variables: {
        where: {id: payload.id},
        data: pick(payload, ['instanceType', 'modelImage', 'imagePullSecret', 'modelURI', 'replicas', 'metadata', 'description', 'updateMessage', 'endpointAccessType', 'env'])
      }
    });
  }

  onCancel = values => {
    const {history, getPhDeployment} = this.props;
    const initialValue = {
      id: get(getPhDeployment, 'phDeployment.id'),
      instanceType: get(getPhDeployment, 'phDeployment.instanceType.id'),
      modelImage: get(getPhDeployment, 'phDeployment.modelImage'),
      imagePullSecret: get(getPhDeployment, 'phDeployment.imagePullSecret'),
      modelURI: get(getPhDeployment, 'phDeployment.modelURI'),
      replicas: get(getPhDeployment, 'phDeployment.replicas'),
      groupId: get(getPhDeployment, 'phDeployment.groupId'),
      name: get(getPhDeployment, 'phDeployment.name'),
      env: get(getPhDeployment, 'phDeployment.env'),
      metadata: get(getPhDeployment, 'phDeployment.metadata'),
      description: get(getPhDeployment, 'phDeployment.description'),
      updateMessage: get(getPhDeployment, 'phDeployment.updateMessage'),
    };

    if (isEqual(values, initialValue))
      return history.goBack();

    Modal.confirm({
      title: 'Do you want to discard the changes?',
      content: 'Your changes will be lost. Are you sure?',
      okText: 'Discard',
      cancelText: 'Cancel',
      onOk: () => history.goBack(),
      cancelButtonProps: {
        style: {
          float: 'right',
          marginLeft: 8
        }
      }
    });
  }

  render() {
    const {getGroups, updatePhDeploymentResult, history, getPhDeployment, groupContext, refetchGroup, match} = this.props;
    const {params} = match;

    if (getPhDeployment.loading) return null;
    if (getPhDeployment.error) {
      return getMessage(getPhDeployment.error)
    };

    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []).filter(group => group.enabledDeployment || group.id === everyoneGroupId);
    const groups = allGroups.filter(group => group.id !== everyoneGroupId);
    const everyoneGroup = allGroups.find(group => group.id === everyoneGroupId);
    const selectedGroup = getPhDeployment.phDeployment.groupId;
    const group = groups
      .find(group => group.id === selectedGroup);
    const instanceTypes = unionBy(
      get(group, 'instanceTypes', []),
      get(everyoneGroup, 'instanceTypes', []),
      'id'
    );
    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/model-deployment/,
        title: 'Model Deployments',
        link: '/model-deployment?page=1'
      },
      {
        key: 'detail',
        matcher: /\/model-deployment\/([\w-])+/,
        title: `Deployment: ${get(getPhDeployment, 'phDeployment.name')}`,
        link: `/model-deployment/${params.deploymentId}`
      },
      {
        key: 'update',
        matcher: /\/model-deployment\/([\w-])+\/edit/,
        title: 'Update Deployment',
      }
    ];

    return (
      <React.Fragment>
        <PageTitle
          title={`Update Deployment`}
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        />
        <div style={{margin: '16px'}}>
          <DeploymentCreateForm
            type="edit"
            initialValue={{
              ...(getPhDeployment.phDeployment || {}),
              instanceTypeId: get(getPhDeployment, 'phDeployment.instanceType.id', ''),
              instanceTypeName: get(getPhDeployment, 'phDeployment.instanceType.name', '')
            }}
            selectedGroup={selectedGroup}
            groups={sortItems(groups)}
            groupContext={groupContext}
            refetchGroup={getGroups.refetch}
            instanceTypes={sortItems(instanceTypes)}
            onSubmit={this.onSubmit}
            onCancel={this.onCancel}
            loading={getGroups.loading || updatePhDeploymentResult.loading}
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
  graphql(GET_PH_DEPLOYMENT, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.deploymentId
        }
      },
      fetchPolicy: 'cache-and-network'
    }),
    name: 'getPhDeployment'
  }),
  graphql(UPDATE_DEPLOYMENT, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        history.push(`../../model-deployment`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Your update has begun deploying.
              Click <a onClick={() => history.push(`model-deployment/${data.updatePhDeployment.id}`)}>here</a> to view.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'updatePhDeployment'
  })
)(DeploymentCreatePage)
