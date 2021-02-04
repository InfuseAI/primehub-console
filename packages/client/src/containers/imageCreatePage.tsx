import * as React from 'react';
import {Card, notification, Skeleton, Row, Col} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy, isEmpty} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {errorHandler} from 'utils/errorHandler';
import ImageCreateForm from 'components/images/createForm';
import {GroupFragment} from 'containers/list';
import PageTitle from 'components/pageTitle';
import {withRouter} from 'react-router-dom';
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import {withUserContext, UserContextComponentProps} from 'context/user';
import Breadcrumbs from 'components/share/breadcrumb';
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
    title: 'New Images'
  }
];

export const GET_MY_GROUPS = gql`
  query me {
    me {
      id
      groups {
        ...GroupInfo
        images { id name displayName description spec global type }
      }
    }
  }
  ${GroupFragment}
`

export const CREATE_IMAGE = gql`
  mutation createImage($data: ImageCreateInput!) {
    createImage(data: $data) {
      id
      name
    }
  }
`

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

type Props = RouteComponentProps & GroupContextComponentProps & UserContextComponentProps & {
  getGroups: any;
  createImage: any;
  createImageResult: any;
  defaultValue?: object;
}

type State = {
  selectedGroup: string | null;
}

class ImageCreatePage extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      selectedGroup: get(props, 'defaultValue.groupId') || null
    }
  }

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = (payload) => {
    const {createImage, groupContext} = this.props;
    const groupConnector = {
      connect: [{id: groupContext.id}]
    };
    payload.groupName = groupContext.name;
    payload.groups = groupConnector
    createImage({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {selectedGroup} = this.state;
    const {userContext, groupContext, history, getGroups, createImageResult, defaultValue} = this.props;
    //if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)){
      //history.push(`../home`);
    //}
    const everyoneGroupId = (window as any).EVERYONE_GROUP_ID;
    const allGroups = get(getGroups, 'me.groups', []);
    const groups = allGroups
      .filter(group => group.id !== everyoneGroupId)
      .filter(group => !groupContext || groupContext.id === group.id );
    const everyoneGroup = allGroups.find(group => group.id === everyoneGroupId);
    const group = groups
      .find(group => group.id === selectedGroup);
    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"New Image"}
        />
        <div style={{
          margin: '16px',
        }}>

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
              showResources={true}
              refetchGroup={getGroups.refetch}
              groupContext={groupContext}
              initialValue={defaultValue}
              selectedGroup={selectedGroup}
              onSelectGroup={this.onChangeGroup}
              groups={sortItems(groups)}
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
  graphql(GET_MY_GROUPS, {
    name: 'getGroups'
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
    return <Com {...props} defaultValue={defaultValue ? JSON.parse(defaultValue.replace(/\n/g, "\\n")) : undefined}  />
  }
)(ImageCreatePage)
