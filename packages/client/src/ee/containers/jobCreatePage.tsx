import * as React from 'react';
import {Card, Skeleton, Row, Col} from 'antd';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, unionBy} from 'lodash';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import {withRouter} from 'react-router-dom';
import {errorHandler} from 'utils/errorHandler';
import JobCreateForm from 'ee/components/job/createForm';
import PageTitle from 'components/pageTitle';
import {withGroupContext, GroupContextComponentProps} from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {sortNameByAlphaBet} from 'utils/sorting';
import {CurrentUser} from 'queries/User.graphql';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/job/,
    title: 'Jobs',
    link: '/job?page=1'
  },
  {
    key: 'create',
    matcher: /\/job\/create/,
    title: 'New Job',
    tips: 'Create a new job.',
    tipsLink: 'https://docs.primehub.io/docs/job-submission-feature#create-job'
  }
];

export const CREATE_JOB = gql`
  mutation createPhJob($data: PhJobCreateInput!) {
    createPhJob(data: $data) {
      id
    }
  }
`;

type Props = RouteComponentProps & GroupContextComponentProps & {
  currentUser: any;
  createPhJob: any;
  createPhJobResult: any;
  defaultValue?: object;
}

type State = {
  selectedGroup: string | null;
}

class JobCreatePage extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      selectedGroup: get(props, 'defaultValue.groupId') || null
    }
  }

  onChangeGroup = (id: string) => {
    this.setState({selectedGroup: id});
  }

  onSubmit = payload => {
    const {createPhJob} = this.props;
    createPhJob({
      variables: {
        data: payload
      }
    });
  }

  render() {
    const {selectedGroup} = this.state;
    const {groupContext, currentUser, createPhJobResult, defaultValue} = this.props;
    const everyoneGroupId = window.EVERYONE_GROUP_ID;
    const jobDefaultActiveDeadlineSeconds = window.jobDefaultActiveDeadlineSeconds;
    const allGroups = get(currentUser, 'me.groups', []);
    const groups = allGroups
      .filter(group => group.id !== everyoneGroupId)
      .filter(group => !groupContext || groupContext.id === group.id );
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
    const jobActiveDeadlineSeconds = get(group, 'jobDefaultActiveDeadlineSeconds', null) || jobDefaultActiveDeadlineSeconds;
    return (
      <React.Fragment>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'New Job'}
        />
        <div style={{
          margin: '16px',
        }}>

          {currentUser.loading ? (
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
            <JobCreateForm
              showResources={true}
              refetchGroup={currentUser.refetch}
              groupContext={groupContext}
              initialValue={defaultValue}
              selectedGroup={selectedGroup}
              onSelectGroup={this.onChangeGroup}
              groups={sortNameByAlphaBet(groups)}
              everyoneGroup={everyoneGroup}
              instanceTypes={sortNameByAlphaBet(instanceTypes)}
              images={sortNameByAlphaBet(images)}
              defaultActiveDeadlineSeconds={jobActiveDeadlineSeconds}
              onSubmit={this.onSubmit}
              loading={createPhJobResult.loading}
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
  graphql(CurrentUser, {
    alias: 'withCurrentUser',
    name: 'currentUser'
  }),
  graphql(CREATE_JOB, {
    options: (props: Props) => ({
      onCompleted: () => {
        props.history.push({
          pathname: `../job`,
          search: queryString.stringify({page: 1})
        });
      },
      onError: errorHandler
    }),
    name: 'createPhJob'
  }),
  Com => props => {
    const {defaultValue}: {defaultValue?: string} = queryString.parse(props.location.search.replace(/^\?/, ''));
    return <Com {...props} defaultValue={defaultValue ? JSON.parse(defaultValue.replace(/\n/g, "\\n")) : undefined}  />;
  }
)(JobCreatePage);
