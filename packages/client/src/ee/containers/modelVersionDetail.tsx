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
import {QueryModelVersion} from 'queries/models.graphql';

const PAGE_SIZE = 20;

type Props = {
  getModelVersion: {
    error?: any;
    loading: boolean;
    variables: {
      where?;
    };
    refetch: Function;
    modelVersion?: any;
  }
} & RouteComponentProps & GroupContextComponentProps;

class ModelVersionDetailContainer extends React.Component<Props> {
  const renderVersion = model => version => (
    <Link to={`${model}/versions/${version}`}>
      {`Version ${version}`}
    </Link>
  );

  render() {
    const { groupContext, getModelVersion, match} = this.props;
    const {modelName, version} = match.params as any;

    const {
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
        link: `/models/${modelName}`
      },
      {
        key: 'version',
        matcher: /\/models/,
        title: `Version: ${version}`,
        link: `/models/${modelName}/versions/${version}`
      },
    ];


    let pageBody = <>
      <div style={{textAlign: 'right'}}>
        <Button>
          MLFlow UI
        </Button>
      </div>
      <Row gutter={36}>
        <Col span={24}>
          <Field labelCol={4} valueCol={8} label='Registered Time' value={modelVersion.creationTimestamp} />
          <Field labelCol={4} valueCol={8} label='Last Modified' value={modelVersion.lastUpdatedTimestamp} />
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
      const {modelName, version} = match.params as any;
      const where = {
        name: modelName,
        version: version,
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
    name: 'getModelVersion'
  }),
)(ModelVersionDetailContainer)
