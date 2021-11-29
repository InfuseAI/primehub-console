import * as React from 'react';
import { notification, Tabs, Tag, Tooltip, Row, Col, Spin } from 'antd';
import { graphql } from 'react-apollo';
import { RouteComponentProps, useParams, useHistory } from 'react-router-dom';
import { compose } from 'recompose';
import moment from 'moment';
import { pick } from 'lodash';

import Breadcrumbs from 'components/share/breadcrumb';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import Field from 'components/share/field';
import Browser from 'components/Browser/Browser';
import { useRoutePrefix } from 'hooks/useRoutePrefix';
import { humanFileSize } from 'utils/index';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import { errorHandler } from 'utils/errorHandler';

import { Dataset, InputVariables } from 'components/datasets/common';
import DatasetCreateForm from 'components/datasets/CreateForm';
import { DatasetQuery, UpdateDatasetMutation } from './dataset.graphql';

interface Props
  extends RouteComponentProps<{ datasetId: string }>,
    GroupContextComponentProps {
  getDataset: {
    error?: Error | undefined;
    loading: boolean;
    datasetV2: Dataset;
  };
}

function _DatasetDetail({ getDataset, updateDataset }) {
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();
  const { path, datasetId, groupName } =
    useParams<{ groupName: string; datasetId: string; path: string }>();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [fileUploaded, setFileUploaded] = React.useState(false);
  const [tabKey, setTabKey] = React.useState('data');

  if (!window?.enablePhfs) {
    history.push('../home');
    return <></>;
  }

  if (getDataset.error) {
    return <div>Failure to load dataset.</div>;
  }

  async function onSubmit(data: Partial<InputVariables>) {
    const { refetch, variables } = getDataset;

    try {
      await updateDataset({
        variables: {
          payload: {
            ...pick(data, ['tags']),
          },
        },
      });

      notification.success({
        message: (
          <>
            Dataset <b>{datasetId}</b> has been updated.
          </>
        ),
        duration: 5,
        placement: 'bottomRight',
      });

      await refetch({
        where: variables.where,
      });
    } catch (e) {
      errorHandler(e);
      // throw it so that the model know something wrong
      throw e;
    }
  }

  const handlePathChange = path => {
    history.push(`${appPrefix}g/${groupName}/datasets/${datasetId}${path}`);
  };

  const handleUploadingChange = uploading => {
    if (!uploading) {
      // Update the lastModified in metadata
      if (fileUploaded) {
        updateDataset({
          variables: {
            payload: {},
          },
        });
      }
      setFileUploaded(false);
    }
    setUploading(uploading);
  };

  const handleFileUpload = () => {
    setFileUploaded(true);
  };
  const hnanleFileDelete = () => {
    updateDataset({
      variables: {
        payload: {},
      },
    });
  };

  const enabledPHFS = window?.enablePhfs || false;
  const dataset = getDataset?.datasetV2 || {};
  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/datasets/,
      title: 'Datasets',
      link: '/datasets',
    },
    {
      key: 'detail',
      matcher: /\/datasets\/([\w-_])+/,
      title: `Dataset: ${datasetId}`,
      tips: 'View the detailed information.',
      // TODO: add doc link
      tipsLink: '',
    },
  ];

  const uploadButton = (
    <InfuseButton
      icon='upload'
      type='primary'
      style={{ marginLeft: 16 }}
      onClick={() => {
        setUploading(true);
      }}
    >
      Upload Files
    </InfuseButton>
  );

  return (
    <>
      <PageTitle breadcrumb={<Breadcrumbs pathList={breadcrumbs} />} />
      <PageBody>
        <Spin spinning={getDataset.loading}>
          <Tabs
            defaultActiveKey='data'
            tabBarExtraContent={tabKey === 'data' ? uploadButton : undefined}
            onChange={key => setTabKey(key)}
            animated={false}
          >
            <Tabs.TabPane key='data' tab='Data'>
              <Browser
                key='browser'
                title={datasetId}
                basePath={`datasets/${dataset.id}`}
                path={path || '/'}
                enabledPHFS={enabledPHFS}
                onPathChange={handlePathChange}
                uploading={uploading}
                onUploadingChange={handleUploadingChange}
                onFileUpload={handleFileUpload}
                onFileDelete={hnanleFileDelete}
              />
            </Tabs.TabPane>
            <Tabs.TabPane key='information' tab='Information'>
              <div
                style={{
                  display: 'flex',
                  marginTop: '5px',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    color: 'rgba(0, 0, 0, 0.85)',
                    padding: '0 35px',
                    fontWeight: 500,
                    fontSize: '20px',
                  }}
                >
                  {dataset.name}
                </div>
                <InfuseButton
                  style={{ minWidth: '60px' }}
                  icon=''
                  type='default'
                  onClick={() => {
                    setModalVisible(true);
                  }}
                >
                  Edit
                </InfuseButton>
              </div>
              <div style={{ padding: '16px 36px' }}>
                <Row gutter={36}>
                  <Col span={24}>
                    <Field
                      labelCol={4}
                      valueCol={20}
                      label='Dataset Name'
                      value={dataset.id}
                    />
                    <Field
                      labelCol={4}
                      valueCol={20}
                      label='Created By'
                      value={dataset.createdBy}
                    />
                    <Field
                      labelCol={4}
                      valueCol={20}
                      label='Last Modified'
                      value={moment(dataset.updatedAt).format(
                        'YYYY-MM-DD HH:mm:ss'
                      )}
                    />
                    <Field
                      labelCol={4}
                      valueCol={20}
                      label='Tags'
                      value={dataset.tags?.map(tag => {
                        const isLongTag = tag.length > 20;
                        const tagElem = (
                          <Tag key={tag}>
                            {isLongTag ? `${tag.slice(0, 20)}...` : tag}
                          </Tag>
                        );
                        return isLongTag ? (
                          <Tooltip title={tag} key={tag}>
                            {tagElem}
                          </Tooltip>
                        ) : (
                          tagElem
                        );
                      })}
                    />
                    <Field
                      labelCol={4}
                      valueCol={20}
                      label='Size'
                      value={
                        dataset.name?.endsWith('/')
                          ? null
                          : humanFileSize(dataset.size, true, 1)
                      }
                    />
                  </Col>
                </Row>
              </div>
            </Tabs.TabPane>
          </Tabs>
          <DatasetCreateForm
            dataset={dataset}
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSubmit={onSubmit}
          />
        </Spin>
      </PageBody>
    </>
  );
}

export const DatasetDetail = compose(
  withGroupContext,
  graphql(DatasetQuery, {
    options: ({ groupContext, match }: Props) => ({
      variables: {
        where: {
          id: match.params.datasetId,
          groupName: groupContext.name,
        },
      },
      fetchPolicy: 'cache-and-network',
    }),
    name: 'getDataset',
    skip: () => !window?.enablePhfs,
  }),
  graphql(UpdateDatasetMutation, {
    options: ({ groupContext, match }: Props) => ({
      variables: {
        where: {
          id: match.params.datasetId,
          groupName: groupContext.name,
        },
      },
    }),
    name: 'updateDataset',
  })
)(_DatasetDetail);
