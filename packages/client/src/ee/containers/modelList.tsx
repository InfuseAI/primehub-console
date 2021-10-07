import * as React from 'react';
import { Skeleton, Tooltip, Typography, Alert, Button, Table } from 'antd';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { get, max } from 'lodash';
import { Link, withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import { GroupContextComponentProps, withGroupContext } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import { formatTimestamp, openMLflowUI } from 'ee/components/modelMngt/common';
import { TruncateTableField } from 'utils/TruncateTableField';
import { QueryModels } from 'queries/Model.graphql';

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
} & RouteComponentProps &
  GroupContextComponentProps;

type State = {
  value: string;
};

class ModelListContainer extends React.Component<Props, State> {
  private renderLatestVersion = (latestVersions, model) => {
    if (!latestVersions || !Array.isArray(latestVersions)) {
      return '-';
    }

    latestVersions = latestVersions.map(a => parseInt(a.version));
    latestVersions = latestVersions.filter(a => !isNaN(a));
    if (latestVersions.length === 0) {
      return '-';
    }

    const latestVersion = max(latestVersions);

    return (
      <Link
        to={`models/${encodeURIComponent(
          model.name
        )}/versions/${latestVersion}`}
      >
        {`Version ${latestVersion}`}
      </Link>
    );
  };

  render() {
    const { getModels } = this.props;
    const { error, loading, mlflow, models, refetch } = getModels;

    const breadcrumbs = [
      {
        key: 'list',
        matcher: /\/models/,
        title: 'Models',
        tips: 'Users can manage and version models here.',
        tipsLink: 'https://docs.primehub.io/docs/model-management',
        onClick: () => {
          refetch();
        },
      },
    ];

    let pageBody;
    if (error) {
      if (
        get(error, 'graphQLErrors.0.extensions.code') ===
        'TRACKING_URI_NOT_FOUND'
      ) {
        pageBody = (
          <Alert
            message='MLflow is not configured'
            description={
              <span>
                MLflow settings are not configured yet. Please go to the group
                settings to configure it.{' '}
                <a href='https://docs.primehub.io/docs/model-configuration'>
                  Learn more
                </a>
              </span>
            }
            type='warning'
            showIcon
          />
        );
      } else if (error.graphQLErrors) {
        pageBody = (
          <Alert
            message='Tracking URI Not Reachable'
            description={`The configured MLflow tracking URI is not reachable. Please check if the MLflow is well configured and the MLflow server is running correctly.`}
            type='error'
            showIcon
          />
        );
      } else {
        pageBody = 'error';
      }
    } else if (loading) {
      pageBody = <Skeleton />;
    } else if (!models) {
      refetch();
    } else {
      pageBody = this.renderModels(mlflow, models, loading);
    }

    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={'Model Management'}
        />
        <PageBody>{pageBody}</PageBody>
      </>
    );
  }

  private renderModels(mlflow: any, models: any, loading: boolean) {
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        render: text => (
          <TruncateTableField text={text} defaultCharacter='-'>
            <Link to={`models/${encodeURIComponent(text)}`}>{text}</Link>
          </TruncateTableField>
        ),
      },
      {
        title: 'Latest Version',
        dataIndex: 'latestVersions',
        render: this.renderLatestVersion,
      },
      {
        title: 'Creation Time',
        dataIndex: 'creationTimestamp',
        render: formatTimestamp,
      },
      {
        title: 'Updated Time',
        dataIndex: 'lastUpdatedTimestamp',
        render: formatTimestamp,
      },
    ];

    const pageBody = (
      <>
        <div style={{ textAlign: 'right' }}>
          <Button
            onClick={() => {
              openMLflowUI(mlflow, '/#/models');
            }}
          >
            MLflow UI
          </Button>
          <Table
            style={{ paddingTop: 8 }}
            dataSource={models}
            columns={columns}
            rowKey='name'
            loading={loading}
          />
        </div>
      </>
    );
    return pageBody;
  }
}

export default compose(
  withRouter,
  withGroupContext,
  graphql(QueryModels, {
    options: (props: Props) => {
      const { groupContext } = props;
      const group = groupContext ? groupContext.name : undefined;
      return {
        variables: {
          group,
        },
        fetchPolicy: 'cache-and-network',
      };
    },
    name: 'getModels',
    alias: 'withGetModels',
  })
)(ModelListContainer);
