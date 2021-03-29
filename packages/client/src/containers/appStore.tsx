import React from 'react';
import {Icon, Card, Divider, Col, Row, Input} from 'antd';
import {get} from 'lodash';
import {graphql} from 'react-apollo';
import {compose} from 'recompose';
import PageTitle from 'components/pageTitle';
import Breadcrumbs from 'components/share/breadcrumb';
import PageBody from 'components/pageBody';
import {Link} from 'react-router-dom';
import {ActionBtn, ClearBoth, Right, Left} from 'components/apps/detail';
import {GetPhAppTemplates} from 'queries/PhAppTemplate.graphql';
import PhAppTemplate from 'interfaces/phAppTemplate';
import AppLogo from 'components/apps/appLogo';

const {Search} = Input;

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

interface State {
  phAppTemplates: PhAppTemplate[];
  searchText: string;
}

class AppStore extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const {getPhAppTemplates} = props;
    const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates', []);
    this.state = {
      phAppTemplates,
      searchText: ''
    };
  }

  componentDidUpdate() {
    const {getPhAppTemplates} = this.props;
    const phAppTemplates = get(getPhAppTemplates, 'phAppTemplates', []);
    if (this.state.phAppTemplates !== phAppTemplates) {
      this.setState({phAppTemplates});
    }
  }

  onSearch = (searchText: string): void => {
    this.setState({searchText});
  }

  render() {
    const {phAppTemplates, searchText} = this.state;
    const filteredPhAppTemplates: PhAppTemplate[] = phAppTemplates.filter(template => {
      const title = template.name;
      const description = template.description || '';
      const index = title.toLowerCase().indexOf(searchText.toLowerCase());
      const descIndex = description.toLowerCase().indexOf(searchText.toLowerCase());
      return index >= 0 || descIndex >= 0;
    });
    return <React.Fragment>
      <PageTitle
        breadcrumb={<Breadcrumbs pathList={breadcrumbs} />}
        title={'Store'}
      />
      <PageBody>
        <Row gutter={24} type='flex' style={{marginBottom: '16px'}}>
          <Col xs={24} md={12} xl={12} xxl={8}>
            <Search placeholder='Search application' onChange={ e => this.onSearch(e.currentTarget.value)} onSearch={this.onSearch}/>
          </Col>
        </Row>
        <Divider/>
        <Row gutter={24} type='flex'>
        {filteredPhAppTemplates.map((appTemplate: PhAppTemplate): JSX.Element => {
          const title = appTemplate.name;
          const description = appTemplate.description || '';
          const index = title.toLowerCase().indexOf(searchText.toLowerCase());
          const descIndex = description.toLowerCase().indexOf(searchText.toLowerCase());
          const text = index >= 0 ? <span>
            {title.substr(0, index)}
            <b style={{
              background: '#faad14'
            }}>{title.substr(index, searchText.length)}</b>
            {title.substr(index + searchText.length)}
          </span> : title;
          const desc = descIndex >= 0 ? <span>
            {description.substr(0, descIndex)}
            <b style={{
              background: '#faad14'
            }}>{description.substr(descIndex, searchText.length)}</b>
            {description.substr(descIndex + searchText.length)}
          </span> : description;
          return (
            <Col xs={24} span={12} md={12} xxl={8} key={appTemplate.id} style={{marginBottom: 16}}>
              <Card style={{borderRadius: '4px'}}>
                <Left>
                  <AppLogo src={appTemplate.icon} style={{marginRight: '8px'}}/>
                </Left>
                <h2 style={{margin: '4px 0 0'}}>{text}</h2>
                <h4>{appTemplate.version}</h4>
                <ClearBoth/>
                <div>{desc}</div>
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
  graphql(GetPhAppTemplates, {
    name: 'getPhAppTemplates',
    alias: 'withPhAppTemplates'
  })
)(AppStore);
