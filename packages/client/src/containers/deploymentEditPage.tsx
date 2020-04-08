import * as React from 'react';
import gql from 'graphql-tag';
import {Icon, notification} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'components/job/errorHandler';
import DeploymentCreateForm from 'components/modelDeployment/createForm';
import {GroupFragment} from 'containers/list';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/modelDeployment/pageTitle';
import InfuseButton from 'components/infuseButton';
import {PhDeploymentFragment} from 'components/modelDeployment/common';
import {GET_PH_DEPLOYMENT, getMessage} from './deploymentDetail';

export const GET_MY_GROUPS = gql`
  query me {
    me(groupsWhere: {enableDeployment: true}) {
      id
      groups {
        ...GroupInfo
        instanceTypes { id name displayName description spec global gpuLimit memoryLimit cpuLimit }
        images { id name displayName description spec global type }
      }
    }
  }
  ${GroupFragment}
`

export const UPDATE_DEPLOYMENT = gql`
  mutation updatePhDeployment($where: PhDeploymentWhereUniqueInput!, $data: PhDeploymentUpdateInput!) {
    updatePhDeployment(where: $where, data: $data) {
      ...PhDeploymentInfo
    }
  }
  ${PhDeploymentFragment}
`;

const compareByAlphabetical = (prev, next) => {
  if(prev < next) return -1;
  if(prev > next) return 1;
  return 0;
}

export const sortItems = (items) => {
  const copiedItems = items.slice();
  copiedItems
    .sort((prev, next) => {
      const prevName = prev.displayName || prev.name;
      const nextName = next.displayName || next.name;
      return compareByAlphabetical(prevName, nextName);
    });
  return copiedItems;
}

type Props = RouteComponentProps<{deploymentId: string}> & {
  getGroups: any; 
  updatePhDeployment: any;
  updatePhDeploymentResult: any;
  getPhDeployment: any;
}
type State = {
  selectedGroup: string | null;
}

class DeploymentCreatePage extends React.Component<Props, State> {
  onSubmit = (payload) => {
    const {updatePhDeployment} = this.props;
    updatePhDeployment({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {getGroups, updatePhDeploymentResult, history, getPhDeployment} = this.props;
    if (getPhDeployment.loading) return null;
    if (getPhDeployment.error) {
      return getMessage(getPhDeployment.error)
    };

    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []);
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
    return (
      <React.Fragment>
        <PageTitle
          title={(
            <div style={{display: 'flex', alignItems: 'center'}}>
              <InfuseButton
                style={{marginRight: 32}}
                onClick={() => history.push(`${appPrefix}model-deployment`)}
              >
                <Icon type="arrow-left" />
                Back
              </InfuseButton>
              Update Deployment
            </div>
          )}
          extra={(
            <></>
          )}
        />
        <DeploymentCreateForm
          type="edit"
          initialValue={{
            ...(getPhDeployment.phDeployment || {}),
            instanceTypeId: get(getPhDeployment, 'phDeployment.instanceType.id', ''),
            instanceTypeName: get(getPhDeployment, 'phDeployment.instanceType.name', '')
          }}
          selectedGroup={selectedGroup}
          groups={sortItems(groups)}
          instanceTypes={sortItems(instanceTypes)}
          onSubmit={this.onSubmit}
          loading={getGroups.loading || updatePhDeploymentResult.loading}
        />
      </React.Fragment>
    );
  }
}

export default compose(
  withRouter,
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
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Your update has begun deploying.
              Click <a onClick={() => history.push(`${appPrefix}model-deployment/${data.updatePhDeployment.id}`)}>here</a> to view.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'updatePhDeployment'
  })
)(DeploymentCreatePage)
