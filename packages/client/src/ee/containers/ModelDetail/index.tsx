import * as React from 'react';
import uniqBy from 'lodash/uniqBy';
import get from 'lodash/get';
import styled from 'styled-components';
import {
  Button,
  Table,
  Row,
  Col,
  Tag,
  Modal,
  Icon,
  Collapse,
  Checkbox,
} from 'antd';
import { SortOrder, ColumnProps } from 'antd/lib/table';
import Field from 'components/share/field';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Link, useParams, useHistory, withRouter } from 'react-router-dom';
import { withApollo } from 'react-apollo';
import type { CheckboxValueType } from 'antd/lib/checkbox/Group';

import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import Breadcrumbs from 'components/share/breadcrumb';
import { GroupContext, withGroupContext } from 'context/group';
import { QueryModel, QueryModelVersionDeploy } from 'queries/Model.graphql';
import {
  formatTimestamp,
  openMLflowUI,
  buildModelURI,
  compareTimestamp,
} from 'ee/components/modelMngt/common';
import { DeployDialog } from 'ee/components/modelMngt/deployDialog';
import { errorHandler } from 'utils/errorHandler';
import { useLocalStorage } from 'hooks/useLocalStorage';
import type { ModelVersion, Deployment } from 'ee/components/modelMngt/types';

const CustomCheckboxGroup = styled(Checkbox.Group)`
  &:before {
    position: absolute;
    content: ' ';
    height: 100%;
    border: 1px solid rgba(0, 0, 0, 0.06);
    left: 4px;
  }

  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;

  .ant-checkbox-group-item {
    margin-left: 36px;
  }
`;

interface Props {
  client: any;
  defaultOpenCollapse?: boolean;
  getModel: {
    error?: Error;
    loading: boolean;
    mlflow: {
      trackingUri: string;
      uiUrl: string;
    };
    model: {
      name: string;
      creationTimestamp: string;
      lastUpdatedTimestamp: string;
      description: string;
      latestVersions: {
        name: string;
        version: string;
      }[];
    };
    refetch: () => Promise<void>;
    modelVersions: ModelVersion[];
  };
}

interface DeployModelInfo {
  visible: boolean;
  phDeployments: Deployment[];
  modelVersion: ModelVersion;
}

interface ModelAttributesInfo {
  checkAll: boolean;
  indeterminate: boolean;
  options: CheckboxValueType[];
}

function ModelDetail({
  getModel,
  defaultOpenCollapse = false,
  ...props
}: Props) {
  const groupContext = React.useContext(GroupContext);
  const [columnsModalVisible, setColumnsModalVisible] = React.useState(false);
  const [deploy, setDeploy] = React.useState<DeployModelInfo>({
    visible: false,
    phDeployments: [],
    modelVersion: null,
  });

  const { modelName } = useParams<{ modelName: string }>();
  const history = useHistory();

  const [defaultModelParams, setModelParams] = useLocalStorage<
    CheckboxValueType[]
  >('primehub-model-params', []);
  const [defaultModelMetrics, setModelMetrics] = useLocalStorage<
    CheckboxValueType[]
  >('primehub-model-metrics', []);

  const decodeModelName = decodeURIComponent(modelName);

  const { modelParameters, modelMetrics } = React.useMemo(() => {
    if (getModel?.modelVersions) {
      const data = getModel.modelVersions.map((m) => get(m, 'run.data'));

      const modelParameters: string[] = uniqBy(
        data.map((d) => get(d, 'params')).flat(),
        'key'
      )
        .map(({ key }) => key)
        .sort((a, b) => (a > b ? 1 : -1));

      const modelMetrics: string[] = uniqBy(
        data.map((d) => get(d, 'metrics')).flat(),
        'key'
      )
        .map(({ key }) => key)
        .sort((a, b) => (a > b ? 1 : -1));

      return {
        modelParameters,
        modelMetrics,
      };
    }

    return {
      modelParameters: [],
      modelMetrics: [],
    };
  }, [getModel]);

  const [currentModelParams, setCurrentModelParams] =
    React.useState<ModelAttributesInfo>({
      checkAll: false,
      options: defaultModelParams,
      indeterminate: false,
    });

  const [currentModelMetrics, setCurrentModelMetrics] =
    React.useState<ModelAttributesInfo>({
      checkAll: false,
      indeterminate: false,
      options: defaultModelMetrics,
    });

  function handleDeploy(modelVersion: ModelVersion) {
    if (!groupContext.enabledDeployment) {
      Modal.warn({
        title: 'Feature not available',
        content:
          'Model Deployment is not enabled for this group. Please contact your administrator to enable it.',
      });
      return;
    }

    props.client
      .query({
        query: QueryModelVersionDeploy,
        variables: {
          groupId: groupContext.id,
        },
        fetchPolicy: 'no-cache',
      })
      .then((result) => {
        setDeploy({
          visible: true,
          phDeployments: result.data.phDeployments,
          modelVersion,
        });
      })
      .catch(errorHandler);
  }

  function handleDeployNew(modelVersion) {
    const defaultValue = {
      modelURI: buildModelURI(modelVersion.name, modelVersion.version),
    };

    history.push(
      `../deployments/create?defaultValue=${encodeURIComponent(
        JSON.stringify(defaultValue)
      )}`
    );
  }

  function handleDeployExisting(modelVersion, deploymentRef) {
    const defaultValue = {
      modelURI: buildModelURI(modelVersion.name, modelVersion.version),
    };

    history.push(
      `../deployments/${
        deploymentRef.id
      }/edit?defaultValue=${encodeURIComponent(JSON.stringify(defaultValue))}`
    );
  }

  function handleDeployCancel() {
    setDeploy({
      visible: false,
      phDeployments: [],
      modelVersion: null,
    });
  }

  function handleColumnsModalOk() {
    setColumnsModalVisible((visible) => !visible);
  }

  function handleSaveModelMetrics() {
    setModelParams(currentModelParams.options);
    setModelMetrics(currentModelMetrics.options);
  }

  React.useEffect(() => {
    // update checkgroup status after fetch data
    setCurrentModelParams((params) => ({
      ...params,
      checkAll: defaultModelParams?.length === modelParameters?.length,
      indeterminate:
        defaultModelParams?.length > 0 &&
        defaultModelParams?.length < modelParameters?.length,
    }));

    setCurrentModelMetrics((metrics) => ({
      ...metrics,
      checkAll: defaultModelMetrics?.length === modelMetrics?.length,
      indeterminate:
        defaultModelMetrics?.length > 0 &&
        defaultModelMetrics?.length < modelMetrics?.length,
    }));
  }, [defaultModelMetrics, defaultModelParams, modelParameters, modelMetrics]);

  const breadcrumbs = [
    {
      key: 'list',
      matcher: /\/models/,
      title: 'Models',
      link: '/models?page=1',
    },
    {
      key: 'model',
      matcher: /\/models/,
      title: `Model: ${decodeModelName}`,
      tips: 'View the model information and versioned model list.',
      tipsLink:
        'https://docs.primehub.io/docs/model-management#versioned-model-list',
      onClick: () => {
        getModel.refetch();
      },
    },
  ];

  const columns: ColumnProps<ModelVersion>[] = [
    {
      key: 'Version',
      title: 'Version',
      dataIndex: 'version',
      width: '200px',
      align: 'center',
      render: (version: ModelVersion['version']) => (
        <Link
          to={`${decodeModelName}/versions/${version}`}
        >{`Version ${version}`}</Link>
      ),
    },
    {
      key: 'Registered At',
      title: 'Registered At',
      dataIndex: 'creationTimestamp',
      width: '200px',
      align: 'center',
      render: formatTimestamp,
      sorter: (a, b) =>
        compareTimestamp(a.creationTimestamp, b.creationTimestamp),
      defaultSortOrder: 'descend' as SortOrder,
    },
    {
      key: 'Deployed By',
      title: 'Deployed By',
      dataIndex: 'deployedBy',
      align: 'center',
      render: (deployedBy: ModelVersion['deployedBy']) => {
        const tags = deployedBy.map((deploy, id) => (
          <Link key={id} to={`../deployments/${deploy.id}`}>
            <Tag>{deploy.name}</Tag>
          </Link>
        ));

        return tags;
      },
    },
    {
      key: 'Parameters',
      title: 'Parameters',
      align: 'center',
      width: '120px',
      render: () => ' - ',
      children:
        currentModelParams.options.length === 0
          ? null
          : currentModelParams.options.map((param) => ({
              key: param as string,
              title: param,
              width: '120px',
              render: (value: ModelVersion) => {
                const [paramValue] = value.run.data.params
                  .sort((a, b) => (a.key > b.key ? 1 : -1))
                  .filter(({ key }) => key === param);

                return paramValue ? paramValue.value : ' - ';
              },
            })),
    },
    {
      key: 'Metrics',
      title: 'Metrics',
      align: 'center',
      width: '120px',
      render: () => ' - ',
      children:
        currentModelMetrics.options.length === 0
          ? null
          : currentModelMetrics.options.map((metric) => ({
              key: metric as string,
              title: metric,
              width: '120px',
              render: (value: ModelVersion) => {
                const [metricValue] = value.run.data.metrics
                  .sort((a, b) => (a.key > b.key ? 1 : -1))
                  .filter(({ key }) => key === metric);

                return metricValue ? metricValue.value : ' - ';
              },
            })),
    },
    {
      key: 'Action',
      title: 'Action',
      align: 'center',
      width: '80px',
      dataIndex: '',
      fixed: 'right',
      render: (text, modelVersion: ModelVersion) => (
        <Button
          onClick={() => {
            handleDeploy(modelVersion);
          }}
        >
          Deploy
        </Button>
      ),
    },
  ];

  if (getModel.error) {
    console.log(getModel.error);
    return <div>Can not not load model.</div>;
  }

  if (getModel.loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={'Model Management'}
      />
      <PageBody>
        <Row>
          <Col span={19}>
            <Field
              labelCol={4}
              valueCol={8}
              label="Created Time"
              value={formatTimestamp(getModel.model.creationTimestamp)}
            />
            <Field
              labelCol={4}
              valueCol={8}
              label="Last Modified"
              value={formatTimestamp(getModel.model.lastUpdatedTimestamp)}
            />
            <Field
              labelCol={4}
              valueCol={8}
              label="Description"
              value={formatTimestamp(getModel.model.description)}
            />
          </Col>
          <Col
            span={5}
            style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}
          >
            <Button
              data-testid="setting-columns"
              onClick={handleColumnsModalOk}
            >
              <Icon type="setting" />
              Columns
            </Button>
            <Button
              onClick={() => {
                openMLflowUI(getModel.mlflow, `/#/models/${modelName}`);
              }}
            >
              MLflow UI
            </Button>

            <Modal
              title="Select Columns"
              visible={columnsModalVisible}
              onCancel={() => {
                setColumnsModalVisible(false);

                // reset to the original options
                setCurrentModelParams((params) => ({
                  ...params,
                  options: defaultModelParams,
                  checkAll:
                    defaultModelParams?.length === modelParameters?.length,
                  indeterminate: defaultModelParams?.length !== 0,
                }));
                setCurrentModelMetrics((metrics) => ({
                  ...metrics,
                  options: defaultModelMetrics,
                  checkAll:
                    defaultModelMetrics?.length === modelMetrics?.length,
                  indeterminate: defaultModelMetrics?.length !== 0,
                }));
              }}
              onOk={() => {
                handleColumnsModalOk();
                handleSaveModelMetrics();
              }}
            >
              <p
                style={{
                  color: '#365abd',
                  fontWeight: 700,
                  lineHeight: '12px',
                  fontSize: '14px',
                }}
              >
                You are starting {modelName} with the following settings:
              </p>

              <Collapse
                bordered={false}
                defaultActiveKey={defaultOpenCollapse && ['1']}
                expandIcon={({ isActive }) => (
                  <Icon type="caret-right" rotate={isActive ? 90 : 0} />
                )}
              >
                <Collapse.Panel
                  key="1"
                  style={{ borderBottom: '0px' }}
                  header={
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <Checkbox
                        data-testid="params-checkbox"
                        indeterminate={currentModelParams.indeterminate}
                        checked={currentModelParams.checkAll}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setCurrentModelParams((params) => ({
                              ...params,
                              checkAll: true,
                              indeterminate: false,
                              options: modelParameters,
                            }));
                          } else {
                            setCurrentModelParams((params) => ({
                              ...params,
                              checkAll: false,
                              indeterminate: false,
                              options: [],
                            }));
                          }
                        }}
                      />
                      <div style={{ cursor: 'auto' }}>Parameters</div>
                    </div>
                  }
                >
                  <CustomCheckboxGroup
                    options={modelParameters}
                    value={currentModelParams.options as CheckboxValueType[]}
                    onChange={(checkedList) => {
                      setCurrentModelParams((params) => ({
                        ...params,
                        options: checkedList,
                        indeterminate:
                          checkedList.length > 0 &&
                          checkedList.length < modelParameters?.length,
                        checkAll:
                          checkedList.length === modelParameters?.length,
                      }));
                    }}
                  />
                </Collapse.Panel>
              </Collapse>

              <Collapse
                bordered={false}
                defaultActiveKey={defaultOpenCollapse && ['1']}
                expandIcon={({ isActive }) => (
                  <Icon type="caret-right" rotate={isActive ? 90 : 0} />
                )}
              >
                <Collapse.Panel
                  key="1"
                  style={{ borderBottom: '0px' }}
                  header={
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <Checkbox
                        data-testid="metrics-checkbox"
                        indeterminate={currentModelMetrics.indeterminate}
                        checked={currentModelMetrics.checkAll}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setCurrentModelMetrics((metrics) => ({
                              ...metrics,
                              checkAll: true,
                              indeterminate: false,
                              options: modelMetrics,
                            }));
                          } else {
                            setCurrentModelMetrics((metrics) => ({
                              ...metrics,
                              checkAll: false,
                              indeterminate: false,
                              options: [],
                            }));
                          }
                        }}
                      />
                      <div style={{ cursor: 'auto' }}>Metrics</div>
                    </div>
                  }
                >
                  <CustomCheckboxGroup
                    options={modelMetrics}
                    value={currentModelMetrics.options as CheckboxValueType[]}
                    onChange={(checkedList) => {
                      setCurrentModelMetrics((metrics) => ({
                        ...metrics,
                        options: checkedList,
                        indeterminate:
                          checkedList.length > 0 &&
                          checkedList.length < modelMetrics?.length,
                        checkAll: checkedList.length === modelMetrics?.length,
                      }));
                    }}
                  />
                </Collapse.Panel>
              </Collapse>
            </Modal>
          </Col>
        </Row>
        <Table
          bordered
          scroll={{ x: 'calc(100% - 248px)' }}
          style={{ paddingTop: 8 }}
          dataSource={getModel.modelVersions}
          columns={columns}
          rowKey={(record) => record.version}
          loading={getModel.loading}
        />
      </PageBody>

      <DeployDialog
        visible={deploy.visible}
        modelVersion={deploy.modelVersion}
        deploymentRefs={deploy.phDeployments}
        onDeployNew={handleDeployNew}
        onDeployExisting={handleDeployExisting}
        onCancel={handleDeployCancel}
      />
    </>
  );
}

export default compose(
  withRouter,
  withGroupContext,
  withApollo,
  graphql(QueryModel, {
    options: (props: any) => {
      const { groupContext, match } = props;
      let { modelName } = match.params as any;

      modelName = decodeURIComponent(modelName);
      const group = groupContext ? groupContext.name : undefined;

      return {
        variables: {
          group,
          name: modelName,
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getModel',
    alias: 'withGetModel',
  })
)(ModelDetail);
