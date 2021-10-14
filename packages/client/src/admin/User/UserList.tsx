import React, { useState, useCallback } from 'react';
import { Table, Col, Layout, Button, Icon, Modal, Tooltip, Input } from 'antd';
import { withRouter, useHistory } from 'react-router-dom';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Pagination from 'components/share/pagination';
import Breadcrumbs from 'components/share/breadcrumb';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import InfuseButton from 'components/infuseButton';
import EmailForm from 'cms-toolbar/sendEmailModal';
import { FilterRow, FilterPlugins, ButtonCol } from 'components/share';
import { errorHandler } from 'utils/errorHandler';
import { TruncateTableField } from 'utils/TruncateTableField';
import { UsersConnection, DeleteUser } from 'queries/User.graphql';

const PAGE_SIZE = 10;
const ButtonGroup = Button.Group;
const { confirm } = Modal;

interface Props {
  dataSource: any;
  loading?: boolean;
  listUser: any;
  deleteUser: any;
}

function List(props: Props) {
  const history = useHistory();
  const [selectedRows, setSelectedRows] = useState([]);
  const [emailFormVisible, setEmailFormVisible] = useState(false);
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/user/,
      title: 'Users',
      link: '/user',
      tips: 'Admin can find and manage user accounts here.',
      tipsLink: 'https://docs.primehub.io/docs/guide_manual/admin-user',
    },
  ];

  const add = () => {
    history.push(`user/add`);
  };

  const edit = id => {
    history.push(`user/${id}`);
  };
  const remove = record => {
    const { deleteUser } = props;
    const { id, username } = record;
    confirm({
      title: `Delete User`,
      content: (
        <span>
          Do you really want to delete user: "<b>{username}</b>"?
        </span>
      ),
      maskClosable: true,
      iconType: 'info-circle',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        return deleteUser({ variables: { where: { id } } });
      },
    });
  };

  const renderAction = (id, record) => {
    return (
      <ButtonGroup>
        <Tooltip placement='bottom' title='Edit'>
          <Button
            icon={'edit'}
            data-testid='edit-button'
            onClick={() => edit(record.id)}
          />
        </Tooltip>
        <Tooltip placement='bottom' title='Delete'>
          <Button
            icon='delete'
            data-testid='delete-button'
            onClick={() => remove(record)}
          />
        </Tooltip>
      </ButtonGroup>
    );
  };

  const renderEnable = value =>
    value ? <Icon type='check' /> : <Icon type='close' />;

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: '20%',
      render: text => <TruncateTableField text={text} />,
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Name',
      dataIndex: 'firstName',
      width: '20%',
      render: (text, record) => (
        <TruncateTableField text={`${text} ${record.lastName}`} />
      ),
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      render: renderEnable,
    },
    {
      title: 'Is Admin',
      dataIndex: 'isAdmin',
      render: renderEnable,
    },
    {
      title: 'Action',
      dataIndex: 'id',
      key: 'action',
      render: renderAction,
      width: 200,
    },
  ];

  const searchHandler = value => {
    const { listUser } = props;
    const { refetch } = listUser;
    const newVariables = {
      userAfter: undefined,
      userFirst: PAGE_SIZE,
      userLast: undefined,
      userBefore: '0',
      where: {
        search: value,
      },
    };
    refetch(newVariables);
  };

  const nextPage = () => {
    const { listUser } = props;
    const { users, refetch } = listUser;
    const after = users.pageInfo.endCursor;
    const newVariables = {
      userAfter: after,
      userFirst: PAGE_SIZE,
      userLast: undefined,
      userBefore: undefined,
    };
    refetch(newVariables);
  };

  const prevPage = () => {
    const { listUser } = props;
    const { users, refetch } = listUser;
    const before = users.pageInfo.startCursor;
    const newVariables = {
      userBefore: before,
      userFirst: PAGE_SIZE,
      userLast: undefined,
      userAfter: undefined,
    };
    refetch(newVariables);
  };

  const onSelectChange = useCallback(
    selectedRowKeys => {
      setSelectedRows(selectedRowKeys);
    },
    [selectedRows]
  );

  const rowSelection = {
    selectedRows,
    onChange: onSelectChange,
  };

  return (
    <Layout>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={'Users'}
      />
      <PageBody>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <Button.Group>
            <InfuseButton
              data-testid='mail-button'
              icon='email'
              onClick={() => {
                setEmailFormVisible(true);
              }}
              style={{ width: 120 }}
              disabled={selectedRows?.length <= 0}
            >
              Send Mail
            </InfuseButton>
            <InfuseButton
              data-testid='add-button'
              icon='plus'
              onClick={add}
              style={{ width: 120 }}
              type='primary'
            >
              Add
            </InfuseButton>
          </Button.Group>
        </div>
        <FilterRow
          type='flex'
          justify='space-between'
          align='bottom'
          style={{ marginBottom: 16, marginTop: 16 }}
        >
          <Col key='search-handler' style={{ flex: 1 }}>
            <FilterPlugins style={{ marginRight: '10px' }}>
              <Input.Search
                data-testid='text-filter-username'
                placeholder='Search for username or email'
                onSearch={searchHandler}
              />
            </FilterPlugins>
          </Col>
          <ButtonCol></ButtonCol>
        </FilterRow>
        <Table
          rowSelection={rowSelection}
          loading={props.loading}
          dataSource={props.dataSource}
          columns={columns}
          rowKey={record => record.id}
          pagination={false}
        />
        <Pagination
          hasNextPage={props.listUser.users?.pageInfo.hasNextPage}
          hasPreviousPage={props.listUser.users?.pageInfo.hasPreviousPage}
          nextPage={nextPage}
          previousPage={prevPage}
        />
        <Modal
          closable
          footer={null}
          onCancel={() => setEmailFormVisible(false)}
          visible={emailFormVisible}
          width={600}
          title='Send Email Form'
          destroyOnClose
        >
          <EmailForm
            ids={selectedRows}
            closeModal={() => setEmailFormVisible(false)}
          />
        </Modal>
      </PageBody>
    </Layout>
  );
}

export const UserList = compose(
  withRouter,
  graphql(UsersConnection, {
    options: () => {
      return {
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'listUser',
    alias: 'withListUser',
  }),
  graphql(DeleteUser, {
    options: (props: any) => ({
      refetchQueries: [
        {
          query: UsersConnection,
          variables: props.listUser.variables,
        },
      ],
      onError: errorHandler,
    }),
    name: 'deleteUser',
    alias: 'withDeleteUser',
  })
)(props => {
  const { listUser, deleteUser } = props;
  const { users, loading } = listUser;
  const dataSource = users ? users.edges.map(edge => edge.node) : [];
  return (
    <React.Fragment>
      <List
        deleteUser={deleteUser}
        listUser={listUser}
        dataSource={dataSource}
        loading={loading}
      />
    </React.Fragment>
  );
});
