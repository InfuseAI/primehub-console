import * as React from 'react';
import {Skeleton, Input, Alert, Button, Table, Row, Col} from 'antd';
import Field from 'components/share/field';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {Link, withRouter} from 'react-router-dom';
import queryString from 'querystring';
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
  private renderVersion = model => version => (
    <Link to={`${model}/versions/${version}`}>
      {`Version ${version}`}
    </Link>
  );

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
        link: `/models/${encodeURIComponent(modelName)}/versions/${version}`
      },
    ];


    let pageBody = <>
      <Row gutter={36}>
        <Col span={20}>
          <Field labelCol={4} valueCol={20} label='Registered At' value={formatTimestamp(modelVersion.creationTimestamp)} />
          <Field labelCol={4} valueCol={20} label='Last Modified' value={formatTimestamp(modelVersion.lastUpdatedTimestamp)} />
          <Field labelCol={4} valueCol={20} label='Source Run' value={<a href="#">Run {get(modelVersion, "run.info.runId")}</a>} />

          <Field style={{marginBottom: 32}} labelCol={4} valueCol={12} label='Parameters'
                 value={<Metadata metadata={get(modelVersion, "run.data.params", [])} />}
          />
          <Field style={{marginBottom: 32}} labelCol={4} valueCol={12} label='Metrics'
                 value={<Metadata metadata={get(modelVersion, "run.data.metrics", [])} />}
          />
          <Field style={{marginBottom: 32}} labelCol={4} valueCol={12} label='Tags'
                 value={<Metadata metadata={get(modelVersion, "run.data.tags", []).filter(tag => !tag.key.startsWith('mlflow.'))} />}
          />
        </Col>
        <Col span={4}>
          <div style={{textAlign: 'right'}}>
              <Button onClick={()=>{
                openMLflowUI(mlflow, `/#/models/${encodeURIComponent(modelName)}/versions/${version}`);
              }}>
                MLflow UI
              </Button>
          </div>
        </Col>
      </Row>
    </>;
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
    name: 'getModelVersion'
  }),
)(ModelVersionDetailContainer)
