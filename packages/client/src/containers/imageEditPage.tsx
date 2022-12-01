import * as React from 'react';
import gql from 'graphql-tag';
import { notification, Modal } from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get, unionBy, isEqual, pick, map } from 'lodash';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import { errorHandler } from 'utils/errorHandler';
import ImageCreateForm from 'components/images/createForm';
import PageTitle from 'components/pageTitle';
import { withGroupContext, GroupContextComponentProps } from 'context/group';
import { withUserContext, UserContextComponentProps } from 'context/user';
import { ImageFragment } from 'containers/imageList';
import Breadcrumbs from 'components/share/breadcrumb';
import { CurrentUser } from 'queries/User.graphql';

export const GET_IMAGE = gql`
  query image($where: ImageWhereUniqueInput!) {
    image(where: $where) {
      ...ImageInfo
    }
  }
  ${ImageFragment}
`;

export const UPDATE_IMAGE = gql`
  mutation updateImage(
    $data: ImageUpdateInput!
    $where: ImageWhereUniqueInput!
  ) {
    updateImage(where: $where, data: $data) {
      ...ImageInfo
    }
  }
  ${ImageFragment}
`;

export const REBUILD_IMAGE = gql`
  mutation rebuildImage(
    $data: ImageSpecUpdateInput!
    $where: ImageWhereUniqueInput!
  ) {
    rebuildImage(where: $where, data: $data) {
      ...ImageInfo
    }
  }
  ${ImageFragment}
`;

export const CANCEL_IMAGE = gql`
  mutation cancelImageBuild($where: ImageWhereUniqueInput!) {
    cancelImageBuild(where: $where) {
      ...ImageInfo
    }
  }
  ${ImageFragment}
`;

const getMessage = error =>
  get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH'
    ? `You're not authorized to view this page.`
    : 'Error';

interface Props
  extends UserContextComponentProps,
    GroupContextComponentProps,
    RouteComponentProps<{ imageId: string }> {
  updateImage: any;
  rebuildImage: any;
  cancelImageBuild: any;
  updateImageResult: any;
  getImage: any;
  currentUser: any;
}

interface State {
  selectedGroup: string | null;
}

class ImageEditPage extends React.Component<Props, State> {
  timer = null;

  onSubmit = payload => {
    const { updateImage, getImage, groupContext } = this.props;
    const { image } = getImage;
    payload.groupName = groupContext.name;
    updateImage({
      variables: {
        where: { id: image.id },
        data: pick(payload, [
          'displayName',
          'type',
          'url',
          'useImagePullSecret',
          'urlForGpu',
          'description',
          'groupName',
        ]),
      },
    });
  };

  onRebuild = payload => {
    const { rebuildImage, getImage, groupContext } = this.props;
    const { image } = getImage;
    const { imageSpec } = payload;
    const { packages } = imageSpec;
    const { apt, pip, conda } = packages;
    imageSpec.packages.apt = apt && apt.length > 0 ? apt.split('\n') : null;
    imageSpec.packages.pip = pip && pip.length > 0 ? pip.split('\n') : null;
    imageSpec.packages.conda =
      conda && conda.length > 0 ? conda.split('\n') : null;
    rebuildImage({
      variables: {
        where: { id: image.id },
        data: pick(imageSpec, ['baseImage', 'packages', 'pullSecret']),
      },
    });
  };

  onCancelBuild = (callback = () => undefined) => {
    const { cancelImageBuild, getImage, groupContext } = this.props;
    const { image } = getImage;
    Modal.confirm({
      title: 'Cancel Build',
      content: 'Are you sure you want to cancel building this custom image?',
      okText: 'Confirm',
      cancelText: 'Back',
      maskClosable: true,
      onOk: () => {
        cancelImageBuild({
          variables: {
            where: { id: image.id },
          },
        });
        callback();
      },
      cancelButtonProps: {
        style: {
          float: 'right',
          marginLeft: 8,
        },
      },
    });
  };

  onCancel = values => {
    const { history, getImage } = this.props;
    const initialValue = {
      id: get(getImage, 'image.id'),
      name: get(getImage, 'image.name'),
      url: get(getImage, 'image.url'),
      type: get(getImage, 'image.type'),
      description: get(getImage, 'image.description'),
      useImagePullSecret: get(getImage, 'image.useImagePullSecret'),
    };
    if (isEqual(values, initialValue)) return history.goBack();

    Modal.confirm({
      title: 'Do you want to discard the changes?',
      content: 'Your changes will be lost. Are you sure?',
      okText: 'Discard',
      cancelText: 'Cancel',
      maskClosable: true,
      onOk: () => history.goBack(),
      cancelButtonProps: {
        style: {
          float: 'right',
          marginLeft: 8,
        },
      },
    });
  };

  render() {
    const { getImage, history, groupContext, userContext, currentUser } =
      this.props;
    if (
      userContext &&
      !get(userContext, 'isCurrentGroupAdmin', false) &&
      !window.isUserAdmin
    ) {
      history.push(`../home`);
    }

    if (!getImage.image) return null;

    if (getImage.error) {
      return getMessage(getImage.error);
    }

    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const allGroups = get(currentUser, 'me.groups', []);
    const groups = allGroups
      .filter(record => record.id !== everyoneGroupId)
      .filter(record => !groupContext || groupContext.id === record.id);
    const everyoneGroup = allGroups.find(
      record => record.id === everyoneGroupId
    );
    const group = groups.find(record => record.id === groupContext.id);
    const availableImages = unionBy(
      get(group, 'images'),
      get(everyoneGroup, 'images')
    );

    const image = getImage.image;
    const selectedGroup = image.groupName;
    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/images/,
        title: 'Images',
        link: '/images?page=1',
      },
      {
        key: 'create',
        matcher: /\/images\/([\w-])+\/edit/,
        title: `Update Images: ${image.displayName}`,
        tips: 'Update the settings of the image.',
        tipsLink: 'https://docs.primehub.io/docs/group-image#add-new-image',
      },
    ];
    return (
      <React.Fragment>
        <PageTitle
          title={`Update Image`}
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        />
        <div style={{ margin: '16px' }}>
          <ImageCreateForm
            type='edit'
            initialValue={{
              ...(image || {}),
            }}
            onSubmit={this.onSubmit}
            onRebuild={this.onRebuild}
            onCancel={this.onCancel}
            onCancelBuild={this.onCancelBuild}
            availableImages={availableImages}
            formType={'edit'}
          />
        </div>
      </React.Fragment>
    );
  }
}

export default compose(
  withRouter,
  withGroupContext,
  withUserContext,
  graphql(CurrentUser, {
    alias: 'withCurrentUser',
    name: 'currentUser',
  }),
  graphql(GET_IMAGE, {
    options: (props: Props) => ({
      variables: {
        where: {
          id: props.match.params.imageId,
        },
      },
      fetchPolicy: 'cache-and-network',
      pollInterval: 5000,
    }),
    name: 'getImage',
  }),
  graphql(UPDATE_IMAGE, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const { history } = props;
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: <>Image {data.updateImage.name} updated.</>,
        });
        history.push(`../../images`);
      },
      onError: errorHandler,
    }),
    name: 'updateImage',
  }),
  graphql(REBUILD_IMAGE, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const { history } = props;
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: <>Image {data.rebuildImage.name} rebuilding.</>,
        });
        history.go(0);
      },
      onError: errorHandler,
    }),
    name: 'rebuildImage',
  }),
  graphql(CANCEL_IMAGE, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const { history } = props;
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: <>Image {data.cancelImageBuild.name} build canceled.</>,
        });
      },
      onError: errorHandler,
    }),
    name: 'cancelImageBuild',
  })
)(ImageEditPage);
