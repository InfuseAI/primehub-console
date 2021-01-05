import * as React from 'react';
import {Col, Button, Input, Tooltip, Table as AntTable, Icon, Modal} from 'antd';
import {RouteComponentProps} from 'react-router';
import {Link, withRouter} from 'react-router-dom';
import {startCase, get} from 'lodash';
import styled from 'styled-components';
import moment from 'moment';
import {appPrefix} from 'utils/env';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import { UserContextComponentProps } from 'context/user';
import {FilterRow, FilterPlugins, ButtonCol} from 'root/cms-toolbar/filter';
import Breadcrumbs from 'components/share/breadcrumb';
const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/images/,
    title: 'Images',
    link: '/images?page=1'
  }
];


const Search = Input.Search;

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

type ImagesConnection = {
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

type Props = RouteComponentProps & GroupContextComponentProps & UserContextComponentProps & {
  groups: Array<any>;
  imagesLoading: boolean;
  imagesError: any;
  imagesConnection: ImagesConnection;
  imagesVariables: any;
  refetchImages?: Function;
  removeImage: Function;
};

class ImageList extends React.Component<Props> {
  state = {
    currentId: null
  };

  handleCancel = (id: string) => {
    const {imagesConnection, removeImage} = this.props;
    const image = imagesConnection.edges.find(edge => edge.node.id === id).node;
    this.setState({currentId: id});
    confirm({
      title: `Cancel`,
      content: `Do you want to cancel '${image.displayName || image.name}'?`,
      iconType: 'info-circle',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
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

  editGroupImage = (id) => {
    const {history} = this.props;
    history.push(`images/${id}/edit`);
  }

  removeGroupImage = async (id) => {
    const {removeImage, refetchImages, imagesVariables} = this.props;
    await removeImage(id);
    refetchImages(imagesVariables);
  }

  searchHandler = (queryString) => {
    const {groupContext, imagesVariables, refetchImages} = this.props;
    let newVariables = {
      ...imagesVariables,
      where: {
        ...imagesVariables.where,
        "_or": []
      }
    }
    if (queryString && queryString.length > 0) {
      newVariables = {
        ...imagesVariables,
        where: {
          ...imagesVariables.where,
          "_or": [
            {name_contains: queryString},
            {displayName_contains: queryString},
            {description_contains: queryString},
            {type_contains: queryString}
          ]
        }
      }
    }
    refetchImages(newVariables);
  }

  handleTableChange = (pagination, _filters, sorter) => {
    const {imagesVariables, refetchImages, history, groupContext, userContext} = this.props;
    const orderBy: any = {}
    if (sorter.field) {
      orderBy[sorter.field] = get(sorter, 'order') === 'ascend' ? 'asc' : 'desc'
    }
    refetchImages({
      ...imagesVariables,
      page: pagination.current,
      orderBy
    });
  }


  render() {
    const { groupContext, groups, imagesConnection, imagesLoading, removeImage, imagesVariables } = this.props;

    const {currentId} = this.state;
    const renderAction = (id, record) => {
      return (
        <Button.Group>
          <Button size={'small'} onClick={() => {this.editGroupImage(id)}}>
            <Icon type="edit" />
          </Button>
          <Button size={'small'} onClick={() => {this.removeGroupImage(id)}}>
            <Icon type="delete" />
          </Button>
        </Button.Group>
      )
    }
    const columns = [{
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      render: text => text
    }, {
      title: 'Display Name',
      dataIndex: 'displayName',
      sorter: true,
      render: renderImageName
    }, {
      title: 'Description',
      sorter: true,
      dataIndex: 'description'
    }, {
      title: 'type',
      sorter: true,
      dataIndex: 'type',
      render: (value) => {
        if (!value) {
          return '-';
        }
        if (value === 'both') {
          return 'universal';
        }
        return value;
      }
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
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"Images"}
        />
        <PageBody>
          <FilterRow align="bottom" style={{marginBottom: 16, marginTop: 16}}>
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
            <ButtonCol>
              <Col>
                <FilterPlugins style={{marginRight: '10px'}}>
                  <Search
                    placeholder={`Search Image`}
                    onSearch={this.searchHandler}
                  />
                </FilterPlugins>
              </Col>
            </ButtonCol>
          </FilterRow>
          <Table
            loading={imagesLoading}
            dataSource={imagesConnection.edges.map(edge => edge.node)}
            columns={columns}
            rowKey="id"
            pagination={{
              current: get(imagesConnection, 'pageInfo.currentPage', 0),
              total: get(imagesConnection, 'pageInfo.totalPage', 0) * 10,
            }}
            onChange={this.handleTableChange}
          />
        </PageBody>
      </>
    )
  }
}

export default withRouter(ImageList);
