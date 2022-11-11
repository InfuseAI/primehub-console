import * as React from 'react';
import {Card, notification, Skeleton, Row, Col} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy } from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {errorHandler} from 'utils/errorHandler';
import ImageCreateForm from 'components/images/createForm';
import PageTitle from 'components/pageTitle';
import {withRouter} from 'react-router-dom';
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import {withUserContext, UserContextComponentProps} from 'context/user';
import Breadcrumbs from 'components/share/breadcrumb';
import {CurrentUser} from 'queries/User.graphql';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/images/,
    title: 'Images',
    link: '/images?page=1'
  },
  {
    key: 'create',
    matcher: /\/images\/create/,
    title: 'New Images',
    tips: 'Create an image by adding existing one or build custom one.',
    tipsLink: 'https://docs.primehub.io/docs/group-image#add-new-image'
  }
];

export const CREATE_IMAGE = gql`
  mutation createImage($data: ImageCreateInput!) {
    createImage(data: $data) {
      id
      name
    }
  }
`;

interface Props extends RouteComponentProps, GroupContextComponentProps, UserContextComponentProps {
  currentUser: any;
  createImage: any;
  createImageResult: any;
  defaultValue?: object;
}

interface State {
  selectedGroup: string | null;
}

class ImageCreatePage extends React.Component<Props, State> {

  onSubmit = payload => {
    const {createImage, groupContext} = this.props;
    const groupConnector = {
      connect: [{id: groupContext.id}]
    };
    payload.groupName = groupContext.name;
    payload.groups = groupConnector;
    if (payload.imageSpec) {
      const { packages } = payload.imageSpec;
      const {apt, pip, conda} = packages;
      payload.imageSpec.packages.apt = apt && apt.split('\n');
      payload.imageSpec.packages.pip = pip && pip.split('\n');
      payload.imageSpec.packages.conda = conda && conda.split('\n');
    }
    createImage({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {userContext, groupContext, history, currentUser, createImageResult, defaultValue} = this.props;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)  && !window.isUserAdmin) {
      history.push(`../home`);
    }
    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const allGroups = get(currentUser, 'me.groups', []);
    const groups = allGroups
      .filter(record => record.id !== everyoneGroupId)
      .filter(record => !groupContext || groupContext.id === record.id);
    const everyoneGroup = allGroups.find(record => record.id === everyoneGroupId);
    const group = groups
      .find(record => record.id === groupContext.id);
    const availableImages = unionBy(get(group, 'images'), get(everyoneGroup, 'images'));
    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'New Image'}
        />
        <div style={{
          margin: '16px',
        }}>

          {currentUser.loading ? (
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
              showResources={true}
              refetchGroup={currentUser.refetch}
              initialValue={defaultValue}
              availableImages={availableImages}
              onSubmit={this.onSubmit}
              loading={createImageResult.loading}
            />
          )}

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
    name: 'currentUser'
  }),
  graphql(CREATE_IMAGE, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        props.history.push({
          pathname: `../images`,
          search: queryString.stringify({page: 1})
        });
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Image created: {data.createImage.name}.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'createImage'
  }),
  Com => props => {
    const {defaultValue}: {defaultValue?: string} = queryString.parse(props.location.search.replace(/^\?/, ''));
    return <Com {...props} defaultValue={defaultValue ? JSON.parse(defaultValue.replace(/\n/g, '\\n')) : undefined}  />;
  }
)(ImageCreatePage);
