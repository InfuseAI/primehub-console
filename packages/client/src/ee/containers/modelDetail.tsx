import * as React from 'react';
import {Skeleton, Button, Table, Row, Col} from 'antd';
import Field from 'components/share/field';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {Link, withRouter} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {QueryModel} from 'queries/Model.graphql';
import {formatTimestamp, compareTimestamp, openMLflowUI} from 'ee/components/modelMngt/common';

const PAGE_SIZE = 200;

type Props = {
  getModel: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
    };
    refetch: Function;
    mlflow?: any;
    model?: any;
    modelVersions?: any;
  };
} & RouteComponentProps & GroupContextComponentProps;

class ModelDetailContainer extends React.Component<Props> {
  private renderVersion = model => version => (
    <Link to={`${model}/versions/${version}`}>
      {`Version ${version}`}
    </Link>
  );

  render() {
    const { groupContext, getModel, match} = this.props;
    let {modelName} = match.params as any;
    modelName = decodeURIComponent(modelName)

    const {
      mlflow,
      model,
      modelVersions,
    } = getModel;

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
        title: `Model: ${modelName}`,
        onClick: () => {getModel.refetch()}
      }
    ];

    let pageBody;
    if (getModel.error) {
      pageBody = 'Cannot load model';
    } else if (!model || !modelVersions) {
      pageBody = <Skeleton />;
    } else {
      pageBody = this.renderModel(modelName, modelVersions, model, mlflow, getModel);
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

  private renderModel(modelName: any, modelVersions: any, model: any, mlflow: any, getModel: { error?: any; loading: boolean; variables: { where?: any; }; refetch: Function; mlflow?: any; model?: any; modelVersions?: any; }) {
    const columns: any = [{
      title: 'Version',
      dataIndex: 'version',
      render: this.renderVersion(modelName),
    }, {
      title: 'Registered At',
      dataIndex: 'creationTimestamp',
      render: formatTimestamp,
      sorter: (a, b) => compareTimestamp(a.creationTimestamp, b.creationTimestamp),
      defaultSortOrder: 'descend',
    }, {
      title: 'Deployed By',
      render: () => '',
    }, {
      title: 'Action',
      render: () => <Button>Deploy</Button>,
    }];
    const data = modelVersions;

    let pageBody = <>
      <Row gutter={36}>
        <Col span={20}>
          <Field labelCol={4} valueCol={8} label='Created Time' value={formatTimestamp(model.creationTimestamp)} />
          <Field labelCol={4} valueCol={8} label='Last Modified' value={formatTimestamp(model.lastUpdatedTimestamp)} />
          <Field labelCol={4} valueCol={8} label='Description' value={formatTimestamp(model.description)} />
        </Col>
        <Col span={4}>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => {
              openMLflowUI(mlflow, `/#/models/${encodeURIComponent(modelName)}`);
            } }>
                         MLflow UI
            </Button>
          </div>
        </Col>
      </Row>
      <Table
        style={{ paddingTop: 8 }}
        dataSource={data}
        columns={columns}
        rowKey="name"
        loading={getModel.loading} />
    </>;
    return pageBody;
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(QueryModel, {
    options: (props: Props) => {
      const {groupContext, match} = props;
      let {modelName} = match.params as any;
      modelName = decodeURIComponent(modelName)
      const group = groupContext ? groupContext.name : undefined;

      return {
        variables: {
          group,
          name: modelName
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModel'
  }),
)(ModelDetailContainer)
