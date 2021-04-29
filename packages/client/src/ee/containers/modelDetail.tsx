import * as React from 'react';
import {Skeleton, Input, Alert, Button, Table, Row, Col} from 'antd';
import Field from 'components/share/field';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {Link, withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {QueryModel, QueryModelVersionsConnection} from 'queries/Model.graphql';
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
  };
  getModelVersionsConnection: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
      after?: string,
      first?: number,
      last?: number,
      before?: string
    };
    refetch: Function;
    modelVersionsConnection?: any;
  };

} & RouteComponentProps & GroupContextComponentProps;

class ModelDetailContainer extends React.Component<Props> {
  private renderVersion = model => version => (
    <Link to={`${model}/versions/${version}`}>
      {`Version ${version}`}
    </Link>
  );

  render() {
    const { groupContext, getModel, getModelVersionsConnection, match} = this.props;
    let {modelName} = match.params as any;
    modelName = decodeURIComponent(modelName)

    const {
      mlflow,
      model,
    } = getModel;
    const {
      modelVersionsConnection,
    } = getModelVersionsConnection;

    if (getModel.error) {
      console.log(getModel.error);
      return 'Cannot load model';
    }

    if (!model || !modelVersionsConnection) {
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
        title: `Model: ${modelName}`,
        onClick: () => {getModelVersionsConnection.refetch()}
      }
    ];

    const columns = [{
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
    }]
    const data = modelVersionsConnection.edges.map(edge => edge.node);

    let pageBody = <>
        <Row gutter={36}>
          <Col span={20}>
            <Field labelCol={4} valueCol={8} label='Created Time' value={formatTimestamp(model.creationTimestamp)} />
            <Field labelCol={4} valueCol={8} label='Last Modified' value={formatTimestamp(model.lastUpdatedTimestamp)} />
            <Field labelCol={4} valueCol={8} label='Description' value={formatTimestamp(model.description)} />
          </Col>
          <Col span={4}>
            <div style={{textAlign: 'right'}}>
              <Button onClick={()=>{
                openMLflowUI(mlflow, `/#/models/${encodeURIComponent(modelName)}`);
              }}>
                MLflow UI
              </Button>
            </div>
          </Col>
        </Row>
      <Table
          style={{paddingTop: 8}}
          dataSource={data}
          columns={columns}
          rowKey="name"
          loading={modelVersionsConnection.loading}
      />
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
  graphql(QueryModel, {
    options: (props: Props) => {
      const {groupContext, match} = props;
      let {modelName} = match.params as any;
      modelName = decodeURIComponent(modelName)
      const where = {
        name: modelName
      } as any;
      if (groupContext) {
        where.group = groupContext.name;
      }

      return {
        variables: {
          where,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModel'
  }),
  graphql(QueryModelVersionsConnection, {
    options: (props: Props) => {
      const {groupContext, match} = props;
      const {modelName} = match.params as any;
      const where = {
        name: modelName
      } as any;
      if (groupContext) {
        where.group = groupContext.name;
      }

      return {
        variables: {
          where,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModelVersionsConnection'
  }),
)(ModelDetailContainer)
