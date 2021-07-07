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
import { SortOrder } from 'antd/lib/table';
import Field from 'components/share/field';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Link, useParams, useHistory, withRouter } from 'react-router-dom';
import { withApollo } from 'react-apollo';

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

function ModelDetailContainer({ getModel, ...props }: Props) {
  const [deploy, setDeploy] = React.useState<{
    visible: boolean;
    phDeployments: Deployment[];
    modelVersion: ModelVersion;
  }>({
    visible: false,
    phDeployments: [],
    modelVersion: null,
  });
  const [columnsModalVisible, setColumnsModalVisible] = React.useState(false);

  const groupContext = React.useContext(GroupContext);
  const { modelName } = useParams<{ modelName: string }>();
  const history = useHistory();

  const decodeModelName = decodeURIComponent(modelName);
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
    setColumnsModalVisible(true);
  }

  function handleColumnsModalCancel() {
    setColumnsModalVisible(false);
  }

  const columns = [
    {
      key: 'Version',
      title: 'Version',
      dataIndex: 'version',
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
      render: formatTimestamp,
      sorter: (a, b) =>
        compareTimestamp(a.creationTimestamp, b.creationTimestamp),
      defaultSortOrder: 'descend' as SortOrder,
    },
    {
      key: 'Deployed By',
      title: 'Deployed By',
      dataIndex: 'deployedBy',
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
      key: 'Action',
      title: 'Action',
      dataIndex: '',
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

  const { modelParameters, modelMetrics } = React.useMemo(() => {
    if (getModel?.modelVersions) {
      const data = getModel.modelVersions.map((m) => get(m, 'run.data'));

      const modelParameters = uniqBy(
        data.map((d) => get(d, 'params')).flat(),
        'key'
      )
        .map(({ key }) => key)
        .sort((a, b) => (a > b ? 1 : -1));

      const modelMetrics = uniqBy(
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

  if (getModel.error) {
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
            <Button onClick={handleColumnsModalOk}>
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
              onOk={handleColumnsModalOk}
              onCancel={handleColumnsModalCancel}
            >
              <p
                style={{
                  color: '#365abd',
                  fontWeight: 700,
                  lineHeight: '12px',
                  fontSize: '14px',
                }}
              >
                You are starting Tensorflow with the following settings:
              </p>

              <Collapse
                bordered={false}
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
                    >
                      <Checkbox />
                      Parameters
                    </div>
                  }
                >
                  <CustomCheckboxGroup options={modelParameters} />
                </Collapse.Panel>
              </Collapse>

              <Collapse
                bordered={false}
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
                    >
                      <Checkbox />
                      Metrics
                    </div>
                  }
                >
                  <CustomCheckboxGroup options={modelMetrics} />
                </Collapse.Panel>
              </Collapse>
            </Modal>
          </Col>
        </Row>
        <Table
          style={{ paddingTop: 8 }}
          dataSource={getModel.modelVersions}
          columns={columns}
          rowKey="name"
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
)(ModelDetailContainer);
