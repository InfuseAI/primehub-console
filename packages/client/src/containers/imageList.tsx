import * as React from 'react';
import gql from 'graphql-tag';
import {get} from 'lodash';
import {notification} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import ImageList from 'components/images/list';
import {errorHandler} from 'utils/errorHandler';
import {Group} from 'ee/components/shared/groupFilter';
import {appPrefix} from 'utils/env';
import {withGroupContext, GroupContextComponentProps } from 'context/group';
import {withUserContext, UserContextComponentProps } from 'context/user';

export const ImageFragment = gql`
  fragment ImageInfo on Image{
    id
    displayName
    description
    url
    urlForGpu
    name
    type
    groupName
    useImagePullSecret
 }
`;

export const GET_IMAGES_CONNECTION = gql`
  query groupImagesConnection($where: ImageWhereInput, $page: Int, $orderBy: ImageOrderByInput) {
    groupImagesConnection(where: $where, page: $page, orderBy: $orderBy) {
      pageInfo {
        totalPage
        currentPage
      }
      edges {
        cursor
        node {
          ...ImageInfo
        }
      }
    }
  }
  ${ImageFragment}
`;

export const DELETE_IMAGE = gql`
  mutation deleteImage($where: ImageWhereUniqueInput!) {
    deleteImage(where: $where) {
      ...ImageInfo
    }
  }
  ${ImageFragment}
`;

type Props = {
  getImagesConnection?: any;
  deleteImage?: any;
  groups: Array<Group>;
} & RouteComponentProps & GroupContextComponentProps & UserContextComponentProps;

class ImageListContainer extends React.Component<Props> {
  componentDidMount = () =>{
  }

  removeImage = async (id) => {
    const {deleteImage, groupContext} = this.props;
    await deleteImage({
      variables: {
        where: {id},
      }
    })
  }

  refetchImages = async (payload) => {
    const payloadWithStringWhere = {...payload};
    if (payloadWithStringWhere.where)
      payloadWithStringWhere.where = JSON.stringify(payload.where);
    if (payloadWithStringWhere.orderBy)
      payloadWithStringWhere.orderBy = JSON.stringify(payload.orderBy || {});

    const {history, getImagesConnection} = this.props;
    const search = queryString.stringify(payloadWithStringWhere);
    await getImagesConnection.refetch(payload);
  }

  render() {
    const {history, groupContext, userContext, getImagesConnection, groups } = this.props;
    //if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)){
      //history.push(`../home`);
    //}
    return (
      <ImageList
        groupContext={groupContext}
        imagesLoading={getImagesConnection.loading}
        imagesError={getImagesConnection.error}
        imagesConnection={getImagesConnection.groupImagesConnection || {pageInfo: {}, edges: []}}
        imagesVariables={getImagesConnection.variables}
        removeImage={this.removeImage}
        refetchImages={this.refetchImages}
        groups={groups}
      />
    );
  }
}

export default compose(
  withRouter,
  withUserContext,
  withGroupContext,
  graphql(GET_IMAGES_CONNECTION, {
    options: (props: Props) => {
      const params = queryString.parse(props.location.search.replace(/^\?/, ''));
      const {groupContext} = props;
      const where = JSON.parse(params.where as string || '{}');
      if (groupContext) {
        where.groupName_contains = groupContext.name;
      }
      return {
        variables: {
          where,
          orderBy: JSON.parse(params.orderBy as string || '{}'),
          page: Number(params.page || 1),
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getImagesConnection'
  }),
  graphql(DELETE_IMAGE, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        const {history} = props;
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: `Image "${data.deleteImage.name}" has been deleted.`
        })
      },
      onError: errorHandler
    }),
    name: 'deleteImage'
  }),
)(ImageListContainer)
