import * as React from 'react';
import { Button, Table, Row, Col, Tag, Modal, Icon } from 'antd';
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

type ModelVersion = {
  name: string;
  version: string;
  creationTimestamp: string;
  lastUpdatedTimestamp: string;
  deployedBy: {
    id: string;
    name: string;
  }[];
  run: {
    info: {
      runId: string;
      experimentId: string;
      status: string;
      startTime: string;
      endTime: string;
      artifactUri: string;
      lifecycleStage: string;
    };
    data: {
      params: {
        key: string;
        value: string;
      }[];
      metricts: {
        key: string;
        value: string;
        timestamp: string;
        step: string;
      }[];
      tags: {
        key: string;
        value: string;
      }[];
    };
  };
};

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
  const [deploy, setDeploy] = React.useState(null);
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
        const deploy = {
          modelVersion,
          deploymentRefs: result.data.phDeployments,
        };
        setDeploy(deploy);
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
    setDeploy(null);
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
            console.log(modelVersion);
            handleDeploy(modelVersion);
          }}
        >
          Deploy
        </Button>
      ),
    },
  ];

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
          <Col span={5} style={{ display: 'flex', gap: '8px' }}>
            <Button>
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
      {deploy && (
        <DeployDialog
          modelVersion={deploy.modelVersion}
          deploymentRefs={deploy.deploymentRefs}
          onDeployNew={handleDeployNew}
          onDeployExisting={handleDeployExisting}
          onCancel={handleDeployCancel}
        />
      )}
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
