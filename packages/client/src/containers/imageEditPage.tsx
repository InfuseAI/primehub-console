import * as React from 'react';
import gql from 'graphql-tag';
import {Icon, notification, Modal} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy, isEqual, pick} from 'lodash';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import ImageCreateForm from 'components/images/createForm';
import PageTitle from 'components/pageTitle';
import ImageBreadcrumb from 'components/images/breadcrumb';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import {sortItems, GET_MY_GROUPS} from 'containers/imageCreatePage';

export const GET_IMAGE = gql`
  query image($where: imageWhereUniqueInput!) {
    image(where: $where) {
      id
      displayName
      name
      url
      urlForGpu
      groupName
    }
  }
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

type Props = RouteComponentProps<{imageId: string}> & {
  getGroups: any;
  updateImage: any;
  updateImageResult: any;
  getImage: any;
}
type State = {
  selectedGroup: string | null;
}

class ImageCreatePage extends React.Component<Props, State> {
  onSubmit = (payload) => {
    const {updateImage} = this.props;
    updateImage({
      variables: {
        where: {id: payload.id},
        data: pick(payload, ['displayName', 'url', 'useImagePullSecret', 'urlForGpu', 'description'])
      }
    });
  }

  onCancel = values => {
    const {history, getImage} = this.props;
    //const initialValue = {
      //id: get(getPhDeployment, 'phDeployment.id'),
      //instanceType: get(getPhDeployment, 'phDeployment.instanceType.id'),
      //modelImage: get(getPhDeployment, 'phDeployment.modelImage'),
      //imagePullSecret: get(getPhDeployment, 'phDeployment.imagePullSecret'),
      //modelURI: get(getPhDeployment, 'phDeployment.modelURI'),
      //replicas: get(getPhDeployment, 'phDeployment.replicas'),
      //groupId: get(getPhDeployment, 'phDeployment.groupId'),
      //name: get(getPhDeployment, 'phDeployment.name'),
      //env: get(getPhDeployment, 'phDeployment.env'),
      //metadata: get(getPhDeployment, 'phDeployment.metadata'),
      //description: get(getPhDeployment, 'phDeployment.description'),
      //updateMessage: get(getPhDeployment, 'phDeployment.updateMessage'),
    //}
    //if (isEqual(values, initialValue))
      //return history.goBack();

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
    const {getGroups, getImage, history, groupContext, refetchGroup} = this.props;
    if (getImage.loading) return null;
    if (getImage.error) {
      return getMessage(getImage.error)
    };

    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []).filter(group => group.enabledDeployment || group.id === everyoneGroupId);
    const groups = allGroups.filter(group => group.id !== everyoneGroupId);
    console.log(getImage);
    const selectedGroup = getImage.image.groupName;
    const group = groups
      .find(group => group.name === selectedGroup);
    //const instanceTypes = unionBy(
      //get(group, 'instanceTypes', []),
      //get(everyoneGroup, 'instanceTypes', []),
      //'id'
    //);
    return (
      <React.Fragment>
        <PageTitle
          title={`Update Deployment`}
          breadcrumb={<ImageBreadcrumb />}
        />
        <div style={{margin: '16px'}}>
          <ImageCreateForm
            type="edit"
            initialValue={{
              ...(getImage.image || {})
            }}
            selectedGroup={selectedGroup}
            groups={sortItems(groups)}
            groupContext={groupContext}
            //refetchGroup={getGroups.refetch}
            //instanceTypes={sortItems(instanceTypes)}
            onSubmit={this.onSubmit}
            onCancel={this.onCancel}
            //loading={getGroups.loading || updatePhDeploymentResult.loading}
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
  graphql(GET_IMAGE, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.imageId
        }
      },
      fetchPolicy: 'cache-and-network'
    }),
    name: 'getImage'
  }),
  //graphql(UPDATE_DEPLOYMENT, {
    //options: (props: Props) => ({
      //onCompleted: (data: any) => {
        //const {history} = props;
        //history.push(`../../model-deployment`);
        //notification.success({
          //duration: 10,
          //placement: 'bottomRight',
          //message: 'Success!',
          //description: (
            //<>
              //Your update has begun deploying.
              //Click <a onClick={() => history.push(`model-deployment/${data.updatePhDeployment.id}`)}>here</a> to view.
            //</>
          //)
        //});
      //},
      //onError: errorHandler
    //}),
    //name: 'updatePhDeployment'
  //})
)(ImageCreatePage)
