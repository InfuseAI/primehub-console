import * as React from 'react';
import {Skeleton, Button, Row, Col} from 'antd';
import Field from 'components/share/field';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {withRouter} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {QueryModelVersion} from 'queries/Model.graphql';
import {formatTimestamp, openMLflowUI} from 'ee/components/modelMngt/common';
import Metadata from 'ee/components/modelMngt/metadata';

const PAGE_SIZE = 20;

type Props = {
  getModelVersion: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
    };
    refetch: Function;
    mlflow?: any;
    modelVersion?: any;
  }
} & RouteComponentProps & GroupContextComponentProps;

class ModelVersionDetailContainer extends React.Component<Props> {
  render() {
    const { groupContext, getModelVersion, match} = this.props;
    let {modelName, version} = match.params as any;
    modelName = decodeURIComponent(modelName)

    const {
      mlflow,
      modelVersion,
    } = getModelVersion;

    if (getModelVersion.error) {
      console.log(getModelVersion.error);
      return 'Cannot load model';
    }

    if (!modelVersion) {
      return <Skeleton />
    }

    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/models/,
        title: 'Models',
        link: '/models?page=1'
      },
      {
        key: 'model',
        matcher: /\/models/,
        title: `${modelName}`,
        link: `/models/${encodeURIComponent(modelName)}`
      },
      {
        key: 'version',
        matcher: /\/models/,
        title: `Version: ${version}`,
        link: `/models/${encodeURIComponent(modelName)}/versions/${version}`,
        tips: 'View the detailed information in this model version.',
        tipsLink: 'https://docs.primehub.io/docs/model-management#versioned-model-detail'
      },
    ];

    let pageBody;
    if (getModelVersion.error) {
      pageBody = 'Cannot load version';
    } else if (!modelVersion) {
      pageBody = <Skeleton />;
    } else {
      pageBody = this.renderVersion(mlflow, modelVersion);
    }

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"Model Management"}
        />
        <PageBody>{pageBody}</PageBody>
      </>
    );
  }

  private renderVersion(mlflow: any, modelVersion: any) {
    const runId = get(modelVersion, "run.info.runId");
    const experimentId = get(modelVersion, "run.info.experimentId");

    return <>
      <Row gutter={36}>
        <Col span={20}>
          <Field labelCol={4} valueCol={20} label='Registered At' value={formatTimestamp(modelVersion.creationTimestamp)} />
          <Field labelCol={4} valueCol={20} label='Last Modified' value={formatTimestamp(modelVersion.lastUpdatedTimestamp)} />
          <Field labelCol={4} valueCol={20} label='Source Run' value={<a href="#" onClick={() => openMLflowUI(mlflow, `/#/experiments/${experimentId}/runs/${runId}`)}>Run {runId}</a>} />

          <Field style={{ marginBottom: 32 }} labelCol={4} valueCol={12} label='Parameters'
            value={<Metadata metadata={get(modelVersion, "run.data.params", [])} />} />
          <Field style={{ marginBottom: 32 }} labelCol={4} valueCol={12} label='Metrics'
            value={<Metadata metadata={get(modelVersion, "run.data.metrics", [])} />} />
          <Field style={{ marginBottom: 32 }} labelCol={4} valueCol={12} label='Tags'
            value={<Metadata metadata={get(modelVersion, "run.data.tags", []).filter(tag => !tag.key.startsWith('mlflow.'))} />} />
        </Col>
        <Col span={4}>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => {
              openMLflowUI(mlflow, `/#/models/${encodeURIComponent(modelVersion.name)}/versions/${modelVersion.version}`);
            } }>
              MLflow UI
            </Button>
          </div>
        </Col>
      </Row>
    </>;
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(QueryModelVersion, {
    options: (props: Props) => {
      const {groupContext, match} = props;
      let {modelName, version} = match.params as any;
      modelName = decodeURIComponent(modelName)
      const group = groupContext ? groupContext.name : undefined;

      return {
        variables: {
          group,
          name: modelName,
          version: version,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModelVersion',
    alias: 'withGetModelVersion',
  }),
)(ModelVersionDetailContainer)
