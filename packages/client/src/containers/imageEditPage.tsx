import * as React from 'react';
import gql from 'graphql-tag';
import {Icon, notification, Modal, Row, Col, Skeleton, Card} from 'antd';
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
import {ImageFragment} from 'containers/imageList';

export const GET_IMAGE = gql`
  query image($where: ImageWhereUniqueInput!) {
    image(where: $where) {
      ...ImageInfo
    }
  }
  ${ImageFragment}
`;

export const UPDATE_IMAGE= gql`
  mutation updateImage($data: ImageUpdateInput!, $where: ImageWhereUniqueInput!) {
    updateImage(where: $where, data: $data) {
      ...ImageInfo
    }
  }
  ${ImageFragment}
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';

type Props = GroupContextComponentProps & RouteComponentProps<{imageId: string}> & {
  getGroups: any;
  updateImage: any;
  updateImageResult: any;
  getImage: any;
}
type State = {
  selectedGroup: string | null;
}

class ImageEditPage extends React.Component<Props, State> {

  onSubmit = (payload) => {
    const { updateImage, getImage } = this.props;
    const { image } = getImage;
    payload.id = image.id;
    updateImage({
      variables: {
        where: {id: image.id},
        data: pick(payload, ['displayName', 'url', 'useImagePullSecret', 'urlForGpu', 'description', 'groupName'])
      }
    });
  }

  onCancel = values => {
    const {history, getImage} = this.props;
    const initialValue = {
      id: get(getImage, 'image.id'),
      name: get(getImage, 'image.name'),
      url: get(getImage, 'image.url'),
      type: get(getImage, 'image.type'),
      description: get(getImage, 'image.description'),
      useImagePullSecret: get(getImage, 'image.useImagePullSecret')
    }
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
    const {getGroups, getImage, history, groupContext} = this.props;
    console.log('gorupContext', groupContext);
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
    return (
      <React.Fragment>
        <PageTitle
          title={`Update Image`}
          breadcrumb={<ImageBreadcrumb />}
        />
        <div style={{margin: '16px'}}>
          {getGroups.loading ? (
            <Row>
              <Col>
                <Card>
                  <Skeleton active />
                  <Skeleton active />
                  <Skeleton active />
                </Card>
              </Col>
            </Row>
          ) : (
          <ImageCreateForm
            type="edit"
            initialValue={{
              ...(getImage.image || {})
            }}
            selectedGroup={selectedGroup}
            groupContext={groupContext}
            onSubmit={this.onSubmit}
            onCancel={this.onCancel}
            formType={'edit'}
          />)}
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
  graphql(UPDATE_IMAGE, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        history.push(`../../images`);
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Image {data.updateImage.name} updated.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'updateImage'
  })
)(ImageEditPage)
