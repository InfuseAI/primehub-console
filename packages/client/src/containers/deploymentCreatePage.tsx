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

export const CREATE_DEPLOYMENT = gql`
  mutation createPhDeployment($data: PhDeploymentCreateInput!) {
    createPhDeployment(data: $data) {
      id
    }
  }
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

type Props = RouteComponentProps & {
  getGroups: any; 
  createPhDeployment: any;
  createPhDeploymentResult: any;
}
type State = {
  selectedGroup: string | null;
}

class DeploymentCreatePage extends React.Component<Props, State> {
  state = {
    selectedGroup: null,
  };

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = (payload) => {
    const {createPhDeployment} = this.props;
    createPhDeployment({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {selectedGroup} = this.state;
    const {getGroups, createPhDeploymentResult, history} = this.props;
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []);
    const groups = allGroups.filter(group => group.id !== everyoneGroupId);
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
          title={(
            <div style={{display: 'flex', alignItems: 'center'}}>
              <InfuseButton
                style={{marginRight: 32}}
                onClick={() => history.push(`${appPrefix}model-deployment`)}
              >
                <Icon type="arrow-left" />
                Back
              </InfuseButton>
              Create Deployment
            </div>
          )}
          extra={(
            <></>
          )}
        />
        <DeploymentCreateForm
          onSelectGroup={this.onChangeGroup}
          selectedGroup={selectedGroup}
          groups={sortItems(groups)}
          instanceTypes={sortItems(instanceTypes)}
          images={sortItems(images)}
          onSubmit={this.onSubmit}
          loading={getGroups.loading || createPhDeploymentResult.loading}
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
  graphql(CREATE_DEPLOYMENT, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        history.push({
          pathname: `${appPrefix}model-deployment`,
          search: queryString.stringify({first: 8})
        });
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Your model has begun deploying.
              Click <a onClick={() => history.push(`${appPrefix}model-deployment/${data.createPhDeployment.id}`)}>here</a> to view.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'createPhDeployment'
  })
)(DeploymentCreatePage)
