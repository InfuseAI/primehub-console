import * as React from 'react';
import {Skeleton, Input, Alert, Button, Table} from 'antd';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {get} from 'lodash';
import {withRouter} from 'react-router-dom';
import queryString from 'querystring';
import {RouteComponentProps} from 'react-router';
import PageTitle from 'components/pageTitle';
import PageBody from 'components/pageBody';
import InfuseButton from 'components/infuseButton';
import { GroupContextComponentProps } from 'context/group';
import Breadcrumbs from 'components/share/breadcrumb';
import {QueryModelsConnection} from 'queries/models.graphql';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/models/,
    title: 'Models',
    link: '/models?page=1'
  }
];

const PAGE_SIZE = 20;

type Props = {
  getModelsConnection: {
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
    modelsConnection?: any;
  };
} & RouteComponentProps & GroupContextComponentProps;

type State = {
  value: string;
}

class ModelListContainer extends React.Component<Props, State> {
  render() {
    const { groupContext, getModelsConnection} = this.props;
    const {
      error,
      loading,
      modelsConnection,
      variables,
      refetch
    } = getModelsConnection;

    if (error) {
      console.log(getModelsConnection.error);
      return 'Error';
    }

    if (!modelsConnection) {
      return <Skeleton />
    }

    const columns = [{
      title: 'Name',
      dataIndex: 'name',
    }, {
      title: 'Creation Time',
      dataIndex: 'creationTimestamp',
    }, {
      title: 'Updated Time',
      dataIndex: 'lastUpdatedTimestamp',
    }]
    const data = modelsConnection.edges.map(edge => edge.node);

    let pageBody = <>
      <div style={{textAlign: 'right'}}>
        <Button>
          MLFlow UI
        </Button>
        <Table
          style={{paddingTop: 8}}
          dataSource={data}
          columns={columns}
          rowKey="name"
          loading={loading}
        />
      </div>
    </>;
    return (
      <>
        <PageTitle
          breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
          title={"Model Deployments"}
        />
        <PageBody>{pageBody}</PageBody>
      </>
    );
  }
}

export default compose(
  withRouter,
  graphql(QueryModelsConnection, {
    options: (props: Props) => {
      const params = queryString.parse(props.location.search.replace(/^\?/, ''));
      const {groupContext} = props;
      const where = JSON.parse(params.where as string || '{}');
      if (groupContext) {
        where.groupId_in = [groupContext.id];
      }

      return {
        variables: {
          first: PAGE_SIZE,
          where,
        },
        fetchPolicy: 'cache-and-network'
      }
    },
    name: 'getModelsConnection'
  }),
)(ModelListContainer)
