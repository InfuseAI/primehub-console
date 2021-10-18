import * as React from 'react';
import {
  Col,
  Button,
  Input,
  Tooltip,
  Table as AntTable,
  Icon,
  Modal,
} from 'antd';
import { Link, useHistory } from 'react-router-dom';
import { get } from 'lodash';
import styled from 'styled-components';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { FilterRow, FilterPlugins, ButtonCol } from 'cms-toolbar/filter';
import Breadcrumbs from 'components/share/breadcrumb';
import { TruncateTableField } from 'utils/TruncateTableField';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/images/,
    title: 'Images',
    link: '/images?page=1',
    tips: 'Group Admin can find/add/build group-specific images here.',
    tipsLink: 'https://docs.primehub.io/docs/group-image',
  },
];

const Search = Input.Search;

const Table = styled(AntTable)`
  background: white;
  .ant-pagination.ant-table-pagination {
    margin-right: 16px;
  }
`;

type ImagesConnection = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  edges: Array<{
    cursor: string;
    node: any;
  }>;
};

interface Props {
  groups: Array<any>;
  imagesLoading: boolean;
  imagesError: any;
  imagesConnection: ImagesConnection;
  imagesVariables: any;
  refetchImages?: (variables: any) => Promise<void>;
  removeImage: (id: string) => Promise<void>;
}

function ImageList({ imagesConnection, imagesLoading, ...props }: Props) {
  const history = useHistory();

  function onSearch(queryString) {
    const { imagesVariables, refetchImages } = props;

    let newVariables = {
      ...imagesVariables,
      where: {
        ...imagesVariables.where,
        search: '',
      },
    };

    if (queryString && queryString.length > 0) {
      newVariables = {
        ...imagesVariables,
        where: {
          ...imagesVariables.where,
          search: queryString,
        },
      };
    }

    refetchImages(newVariables);
  }

  function handleTableChange(pagination, _filters, sorter) {
    const { imagesVariables, refetchImages } = props;
    const orderBy = {};

    if (sorter.field) {
      orderBy[sorter.field] =
        get(sorter, 'order') === 'ascend' ? 'asc' : 'desc';
    }

    refetchImages({
      ...imagesVariables,
      page: pagination.current,
      orderBy,
    });
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      width: '20%',
      render: function RenderName(text, record) {
        return (
          <TruncateTableField text={text}>
            <>
              {text}{' '}
              {!record.isReady && (
                <Icon type='warning' title='Image is not ready.' />
              )}
            </>
          </TruncateTableField>
        );
      },
    },
    {
      title: 'Display Name',
      dataIndex: 'displayName',
      sorter: true,
      width: '20%',
      render: function RenderDisplayName(text, record) {
        return (
          <TruncateTableField text={text}>
            <Link
              to={{
                state: {
                  prevPathname: location.pathname,
                  prevSearch: location.search,
                },
                pathname: `images/${record.id}/edit`,
              }}
            >
              {text}
            </Link>
          </TruncateTableField>
        );
      },
    },
    {
      title: 'Description',
      sorter: true,
      dataIndex: 'description',
      render: text => <TruncateTableField text={text} />,
    },
    {
      title: 'Type',
      sorter: true,
      dataIndex: 'type',
      render: value => {
        if (!value) {
          return '-';
        }
        if (value === 'both') {
          return 'Universal';
        }
        return value.toUpperCase();
      },
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      key: 'actions',
      render: function RenderActions(id, { name, displayName }) {
        return (
          <Button.Group>
            <Tooltip placement='bottom' title='Edit'>
              <Button
                icon='edit'
                onClick={() => {
                  history.push(`images/${id}/edit`);
                }}
              />
            </Tooltip>
            <Tooltip placement='bottom' title='Delete'>
              <Button
                icon='delete'
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Image',
                    content: (
                      <>
                        Are you sure to delete{' '}
                        <strong>{displayName || name}</strong>?
                      </>
                    ),
                    okText: 'Yes',
                    maskClosable: true,
                    onOk: async () => {
                      try {
                        await props.removeImage(id);
                        props.refetchImages(props.imagesVariables);
                      } catch (err) {
                        console.error(err);
                      }
                    },
                  });
                }}
              />
            </Tooltip>
          </Button.Group>
        );
      },
      width: 200,
    },
  ];

  return (
    <>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={'Images'}
      />
      <PageBody>
        <FilterRow align='bottom' style={{ marginBottom: 16, marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
            }}
          >
            <InfuseButton
              icon='plus'
              onClick={() => history.push(`images/create`)}
              style={{ marginRight: 16, width: 120 }}
              type='primary'
            >
              New Image
            </InfuseButton>
          </div>
          <ButtonCol>
            <Col>
              <FilterPlugins style={{ marginRight: '10px' }}>
                <Search placeholder={`Search Image`} onSearch={onSearch} />
              </FilterPlugins>
            </Col>
          </ButtonCol>
        </FilterRow>
        <Table
          loading={imagesLoading}
          dataSource={imagesConnection.edges.map(edge => edge.node)}
          columns={columns}
          rowKey='id'
          pagination={{
            current: get(imagesConnection, 'pageInfo.currentPage', 0),
            total: get(imagesConnection, 'pageInfo.totalPage', 0) * 10,
          }}
          onChange={handleTableChange}
        />
      </PageBody>
    </>
  );
}

export default ImageList;
