import * as React from 'react';
import {Skeleton, Input, Alert, Button, Table} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get, max} from 'lodash';
import {Link, withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {formatTimestamp, openMLflowUI} from 'ee/components/modelMngt/common';
import {QueryModels} from 'queries/Model.graphql';

const PAGE_SIZE = 20;

type Props = {
  getModels: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
    };
    refetch: Function;
    mlflow?: any;
    models?: any;
  };
} & RouteComponentProps & GroupContextComponentProps;

type State = {
  value: string;
}

class ModelListContainer extends React.Component<Props, State> {
  private renderName = text => text ? (
    <Link to={`models/${encodeURIComponent(text)}`}>
      {text}
    </Link>
  ) : '-'

  private renderLatestVersion= (latestVersions, model) => {
    if (!latestVersions || !Array.isArray(latestVersions)) {
      return '-';
    }

    latestVersions = latestVersions.map(a => parseInt(a.version));
    latestVersions = latestVersions.filter(a => !isNaN(a));
    if (latestVersions.length === 0) {
      return '-';
    }

    const latestVersion = max(latestVersions);

    return <Link to={`models/${encodeURIComponent(model.name)}/versions/${latestVersion}`}>
      {`Version ${latestVersion}`}
    </Link>
  }

  render() {
    const { groupContext, getModels} = this.props;
    const {
      error,
      loading,
      mlflow,
      models,
      refetch
    } = getModels;

    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/models/,
        title: 'Models',
        onClick: () => {refetch()},
      }
    ];

    let pageBody;
    if (error) {
      if (get(error, 'graphQLErrors.0.extensions.code') === 'TRACKING_URI_NOT_FOUND') {
        pageBody = <Alert
          message="MLflow is not configured"
          description="MLflow settings are not configured yet. Please go to the group settings to configure it."
          type="warning"
          showIcon/>;
      } else if (error.graphQLErrors) {
        pageBody = <Alert
          message="Tracking URI Not Reachable"
          description={`The configured MLflow tracking URI is not reachable. Please check if the MLflow is well configured and the MLflow server is running correctly.`}
          type="error"
          showIcon/>;
      } else {
        pageBody = 'error'
      }
    } else if (!models) {
      pageBody = <Skeleton />
    } else {
      pageBody = this.renderModels(mlflow, models, loading);
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

  private renderModels(mlflow: any, models: any, loading: boolean) {
    const columns = [{
      title: 'Name',
      dataIndex: 'name',
      render: this.renderName,
    }, {
      title: 'Latest Version',
      dataIndex: 'latestVersions',
      render: this.renderLatestVersion,
    }, {
      title: 'Creation Time',
      dataIndex: 'creationTimestamp',
      render: formatTimestamp,
    }, {
      title: 'Updated Time',
      dataIndex: 'lastUpdatedTimestamp',
      render: formatTimestamp,
    }];

    let pageBody = <>
      <div style={{ textAlign: 'right' }}>
        <Button onClick={() => {
          openMLflowUI(mlflow, '/#/models');
        } }>
          MLflow UI
        </Button>
        <Table
          style={{ paddingTop: 8 }}
          dataSource={models}
          columns={columns}
          rowKey="name"
          loading={loading} />
      </div>
    </>;
    return pageBody;
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(QueryModels, {
    options: (props: Props) => {
      const {groupContext} = props;
      const group = groupContext ? groupContext.name : undefined;
      return {
        variables: {
          group,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModels'
  }),
)(ModelListContainer)
