import * as React from 'react';
import { notification, Tabs, Tag, Row, Col, Spin } from 'antd';
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
import {
  GroupContext,
  GroupContextComponentProps,
  withGroupContext,
} from 'context/group';
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
  const groupContext = React.useContext(GroupContext);
  const history = useHistory();
  const { appPrefix } = useRoutePrefix();
  const { path, datasetId, groupName } =
    useParams<{ groupName: string; datasetId: string; path: string }>();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [tabKey, setTabKey] = React.useState('data');

  if (getDataset.error) {
    return <div>Failure to load dataset.</div>;
  }

  async function onSubmit(data: Partial<InputVariables>) {
    const { refetch, variables } = getDataset;

    await updateDataset({
      variables: {
        payload: {
          ...pick(data, ['tags']),
          groupName: groupContext.name,
        },
      },
    });

    refetch({
      where: variables.where,
    });
  }

  const handleChangePath = path => {
    history.push(`${appPrefix}g/${groupName}/datasets/${datasetId}${path}`);
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
          >
            <Tabs.TabPane key='data' tab='Data'>
              <Browser
                title={datasetId}
                basePath={`datasets/${dataset.id}`}
                path={path || '/'}
                enabledPHFS={enabledPHFS}
                onChangePath={handleChangePath}
                uploading={uploading}
                onUploadingChange={(uploading: boolean) => {
                  setUploading(uploading);
                }}
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
                      value={dataset.tags?.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
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
  }),
  graphql(UpdateDatasetMutation, {
    options: ({ groupContext, match }: Props) => ({
      variables: {
        where: {
          id: match.params.datasetId,
          groupName: groupContext.name,
        },
      },
      onCompleted: (data: any) => {
        const dataset = data.updateDatasetV2;
        notification.success({
          message: (
            <>
              Dataset <b>{dataset.id}</b> has been updated.
            </>
          ),
          duration: 5,
          placement: 'bottomRight',
        });
      },
      onError: errorHandler,
    }),
    name: 'updateDataset',
  })
)(_DatasetDetail);
