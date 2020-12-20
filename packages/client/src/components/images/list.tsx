import * as React from 'react';
import {Button, Tooltip, Table as AntTable, Icon, Modal} from 'antd';
import {RouteComponentProps} from 'react-router';
import {Link, withRouter} from 'react-router-dom';
import {startCase, get} from 'lodash';
import styled from 'styled-components';
import moment from 'moment';
import ImageBreadcrumb from 'components/images/breadcrumb';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';

const {confirm} = Modal;
const Table = styled(AntTable as any)`
  background: white;
  .ant-pagination.ant-table-pagination {
    margin-right: 16px;
  }
`;

const renderImageName = (text, record) => (
  <Tooltip
    placement="top"
    title={`Image ID: ${record.id}`}
  >
    <Link to={{
      state: {
        prevPathname: location.pathname,
        prevSearch: location.search,
      },
      pathname: `images/${record.id}/edit`
    }} >
      {text}
    </Link>
  </Tooltip>
);

const renderTimeIfValid = time => {
  if (!time) {
    return '-'
  }

  const momentTime = moment(time);
  return momentTime.isValid() ? momentTime.format('YYYY-MM-DD HH:mm:ss') : '-';
}



type JobsConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  },
  edges: Array<{
    cursor: string;
    node: any
  }>
}

type Props = RouteComponentProps & GroupContextComponentProps & {
  groups: Array<any>;
  jobsLoading: boolean;
  jobsError: any;
  jobsConnection: JobsConnection;
  jobsVariables: any;
  jobsRefetch: Function;
  rerunPhJob: Function;
  cancelPhJob: Function;
  rerunPhJobResult: any;
  cancelPhJobResult: any;
};

class JobList extends React.Component<Props> {
  state = {
    currentId: null
  };

  handleCancel = (id: string) => {
    const {jobsConnection, cancelPhJob} = this.props;
    const job = jobsConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({currentId: id});
    confirm({
      title: `Cancel`,
      content: `Do you want to cancel '${job.displayName || job.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        return cancelPhJob({variables: {where: {id}}});
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  handleRerun = (id: string) => {
    const {jobsConnection, rerunPhJob} = this.props;
    const job = jobsConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({currentId: id});
    confirm({
      title: `Rerun`,
      content: `Do you want to rerun '${job.displayName || job.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        return rerunPhJob({variables: {where: {id}}});
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  }

  createGroupImage = () => {
    const {history} = this.props;
    history.push(`images/create`);
  }

  changeFilter = ({
    selectedGroups,
    submittedByMe
  }: {
    selectedGroups: Array<string>;
    submittedByMe: boolean;
  }) => {
    const {groupContext, jobsVariables, jobsRefetch} = this.props;
    const newVariables = {
      ...jobsVariables,
      where: {
        ...jobsVariables.where,
        mine: submittedByMe,
      }
    };

    if (!groupContext) {
      newVariables.where.groupId_in = selectedGroups;
    }

    jobsRefetch(newVariables);
  }

  searchHandler = (queryString) => {
    const {groupContext, jobsVariables, jobsRefetch} = this.props;
    if (queryString && queryString.length > 0) {
      const newVariables = {
        ...jobsVariables,
        where: {
          ...jobsVariables.where,
          displayName_contains: queryString
        }
      }
    }
    jobsRefetch(newVariables);
  }


  handleTableChange = (pagination, _filters, sorter) => {
    const {jobsVariables, jobsRefetch} = this.props;
    const orderBy: any = {}
    if (sorter.field) {
      orderBy[sorter.field] = get(sorter, 'order') === 'ascend' ? 'asc' : 'desc'
    }
    jobsRefetch({
      ...jobsVariables,
      page: pagination.current,
      orderBy
    });
  }

  cloneJob = (record) => {
    const {groupContext, history} = this.props;
    let data: any = {
      displayName: record.displayName,
      groupId: !groupContext ? record.groupId : groupContext.id,
      groupName: !groupContext ? record.groupName : groupContext.name,
      instanceTypeId: get(record, 'instanceType.id'),
      instanceTypeName: get(record, 'instanceType.displayName') || get(record, 'instanceType.name'),
      image: record.image,
      command: record.command,
    }
    history.push(`job/create?defaultValue=${encodeURIComponent(JSON.stringify(data))}`)
  }

  render() {
    const {groupContext, groups, jobsConnection, jobsLoading, jobsVariables, cancelPhJobResult, rerunPhJobResult} = this.props;
    const {currentId} = this.state;
    const renderAction = (id, record) => {
      return (
        <Button.Group>
          <Button onClick={() => {return undefined;}}>
            Edit
          </Button>
          <Button onClick={() => {return undefined;}}>remove</Button>
        </Button.Group>
      )
    }
    const columns = [{
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      render: text => startCase(text)
    }, {
      title: 'Display Name',
      dataIndex: 'displayName',
      sorter: true,
      render: renderImageName
    }, {
      title: 'Description',
      sorter: true,
      dataIndex: 'discription'
    }, {
      title: 'type',
      sorter: true,
      dataIndex: 'type',
      render: text => text
    }, {
      title: 'Actions',
      dataIndex: 'id',
      key: 'actions',
      render: renderAction,
      width: 200
    }]

    return (
      <>
        <PageTitle
          breadcrumb={<ImageBreadcrumb />}
          title={"Images"}
        />
        <PageBody>
          <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
            <InfuseButton
              icon="plus"
              onClick={this.createGroupImage}
              style={{marginRight: 16, width: 120}}
              type="primary"
            >
              New Image
            </InfuseButton>
          </div>
          <Table
            loading={jobsLoading}
            dataSource={jobsConnection.edges.map(edge => edge.node)}
            columns={columns}
            rowKey="id"
            pagination={{
              current: get(jobsConnection, 'pageInfo.currentPage', 0),
              total: get(jobsConnection, 'pageInfo.totalPage', 0) * 10,
            }}
            onChange={this.handleTableChange}
          />
        </PageBody>
      </>
    )
  }
}

export default withRouter(JobList);
