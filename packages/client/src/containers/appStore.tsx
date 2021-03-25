import React from 'react';
import {Icon, Card, Divider, Col, Row} from 'antd';
import {get} from 'lodash';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import {GET_APP_TEMPLATES} from 'containers/appCreatePage';
import PageTitle from 'components/pageTitle';
import Breadcrumbs from 'components/share/breadcrumb';
import PageBody from 'components/pageBody';
import {AppLogo} from 'components/apps/card';
import {Link} from 'react-router-dom';
import {ActionBtn, ClearBoth, Right, Left} from 'components/apps/detail';

const breadcrumbs = [
  {
    key: 'list',
    matcher: /\/apps/,
    title: 'Apps',
    link: '/apps?page=1'
  },
  {
    key: 'store',
    matcher: /\/apps\/store/,
    title: 'Store'
  }
];

interface Props {
  getPhAppTemplates: any;
}

class AppStore extends React.Component<Props> {
  render() {
    const {getPhAppTemplates} = this.props;
    const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates', []);
    return <React.Fragment>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={'Store'}
      />
      <PageBody>
        <Row gutter={24} type='flex'>
        {phAppTemplates.map(appTemplate => {
          return (
            <Col xs={24} md={12} xl={12} xxl={8} key={appTemplate.id} style={{marginBottom: 16}}>
              <Card style={{margin: '16px 16px 0'}} >
                <Left>
                  <AppLogo style={{marginRight: '8px'}}>
                    <img src={appTemplate.icon}/>
                  </AppLogo>
                </Left>
                <h2 style={{margin: '4px 0 0'}}>{appTemplate.name}</h2>
                <h4>{appTemplate.version}</h4>
                <ClearBoth/>
                <div>{appTemplate.description}</div>
                <Divider style={{margin: '8px 0'}}/>
                <div style={{marginBottom: 0}}>
                  <Left>
                    <ActionBtn href={`${appTemplate.docLink}`} target='_blank'>
                      <Icon type='read' /> App Documents
                    </ActionBtn>
                  </Left>
                  <Right>
                    <ActionBtn type='primary'>
                      <Link to={`create/${appTemplate.id}`}>
                        <Icon type='plus' /> Install to PrimeHub
                      </Link>
                    </ActionBtn>
                  </Right>
                  <ClearBoth/>
                </div>
              </Card>
            </Col>
          );
        })}
        </Row>
      </PageBody>
    </React.Fragment>;
  }
}

export default compose(
  graphql(GET_APP_TEMPLATES, {
    name: 'getPhAppTemplates'
  })
)(AppStore);
