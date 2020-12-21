import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import ImageList from 'components/images/list';
import {errorHandler} from 'utils/errorHandler';
import {Group} from 'ee/components/shared/groupFilter';
import {appPrefix} from 'utils/env';
import { withGroupContext, GroupContextComponentProps } from 'context/group';

export const ImageFragment = gql`
  fragment ImageInfo on Image{
    id
    displayName
    name
 }
`

export const GET_IMAGES_CONNECTION = gql`
  query imagesConnection($where: ImageWhereInput, $page: Int, $orderBy: ImageOrderByInput) {
    imagesConnection(where: $where, page: $page, orderBy: $orderBy) {
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

type Props = {
  getImagesConnection?: any;
  groups: Array<Group>;
} & RouteComponentProps & GroupContextComponentProps;

class ImageListContainer extends React.Component<Props> {

  render() {
    const {groupContext, getImagesConnection, groups } = this.props;
    return (
      <ImageList
        groupContext={groupContext}
        imagesLoading={getImagesConnection.loading}
        imagesError={getImagesConnection.error}
        imagesConnection={getImagesConnection.imagesConnection || {pageInfo: {}, edges: []}}
        imagesVariables={getImagesConnection.variables}
        groups={groups}
      />
    );
  }
}

export default compose(
  withRouter,
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
  })
)(ImageListContainer)
