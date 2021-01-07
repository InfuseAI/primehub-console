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
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import {withUserContext, UserContextComponentProps } from 'context/user';
import {sortItems, GET_MY_GROUPS} from 'containers/imageCreatePage';
import {ImageFragment} from 'containers/imageList';
import Breadcrumbs from 'components/share/breadcrumb';

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

type Props = UserContextComponentProps & GroupContextComponentProps & RouteComponentProps<{imageId: string}> & {
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
    const { updateImage, getImage, groupContext } = this.props;
    const { image } = getImage;
    payload.groupName = groupContext.name;
    updateImage({
      variables: {
        where: {id: image.id},
        data: pick(payload, ['displayName', 'type', 'url', 'useImagePullSecret', 'urlForGpu', 'description', 'groupName'])
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
    const {getGroups, getImage, history, groupContext, userContext} = this.props;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)){
      history.push(`../home`);
    }

    if (getImage.loading) return null;
    if (getImage.error) {
      return getMessage(getImage.error)
    };

    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []).filter(group => group.enabledDeployment || group.id === everyoneGroupId);
    const groups = allGroups.filter(group => group.id !== everyoneGroupId);
    const image = getImage.image;
    const selectedGroup = image.groupName;
    const group = groups
      .find(group => group.name === selectedGroup);
    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/images/,
        title: 'Images',
        link: '/images?page=1'
      },
      {
        key: 'create',
        matcher: /\/images\/([\w-])+\/edit/,
        title: `Update Images: ${image.displayName}`
      }
    ];
    return (
      <React.Fragment>
        <PageTitle
          title={`Update Image`}
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
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
              ...(image || {})
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
  withUserContext,
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
        history.push(`../../images`);
      },
      onError: errorHandler
    }),
    name: 'updateImage'
  })
)(ImageEditPage)
