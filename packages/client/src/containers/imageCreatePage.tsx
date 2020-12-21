import * as React from 'react';
import {Card, Skeleton, Row, Col} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy, isEmpty} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import ImageCreateForm from 'components/images/createForm';
import ImageBreadcrumb from 'components/images/breadcrumb';
import {GroupFragment} from 'containers/list';
import PageTitle from 'components/pageTitle';
import { withGroupContext, GroupContextComponentProps } from 'context/group';

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

type Props = RouteComponentProps & GroupContextComponentProps & {
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
    const {groupContext, getGroups, createImageResult, defaultValue} = this.props;
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
          breadcrumb={<ImageBreadcrumb />}
          title={"New Image"}
        />
        <div style={{
          margin: '16px',
        }}>

          {getGroups.loading ? (
            <Row gutter={16}>
              <Col xs={24} sm={8} lg={8}>
                <Card>
                  <Skeleton active />
                  <Skeleton active />
                  <Skeleton active />
                </Card>
              </Col>
              <Col xs={24} sm={16} lg={16}>
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
  graphql(GET_MY_GROUPS, {
    name: 'getGroups'
  }),
  graphql(CREATE_IMAGE, {
    options: (props: Props) => ({
      onCompleted: () => {
        props.history.push({
          pathname: `../images`,
          search: queryString.stringify({page: 1})
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
