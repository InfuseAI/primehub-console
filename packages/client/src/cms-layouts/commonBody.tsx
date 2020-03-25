import * as React from 'react';
import {Breadcrumb, Icon, Button, Spin} from 'antd';
import {Item} from 'canner-helpers';
import {injectIntl} from 'react-intl';
import styled from 'styled-components';
import {get, startCase} from 'lodash';
import AddButton from './addButtton';
import {Props} from '../cms-components/types';

function getRouteName(key) {
  switch (key) {
    case 'buildImage':
      return 'Image Builder';
    case 'system':
      return startCase(key);
    default:
      return `${startCase(key)}s`;
  }
}

const ButtonWrapper = styled.div<{visible: boolean}>`
  text-align: right;
  display: ${props => props.visible ? undefined: 'none'};
`;


@injectIntl
export default class CommonBody extends React.Component<Props> {
  state = {
    loading: false,
    loadingTip: ''
  };

  back = () => {
    const {goTo, routes, routerParams} = this.props;
    const groupId = get(routerParams, 'payload.backToGroup', '');
    if (groupId) {
      goTo({
        pathname: `group/${groupId}`,
        operator: 'update',
      });
    } else {
      goTo({
        pathname: routes[0],
      })
    }
  }

  add = () => {
    const {goTo, routes} = this.props;
    goTo({
      pathname: `${routes[0]}`,
      operator: 'create'
    });
  }

  deploy = () => {
    const {routes, deploy, intl} = this.props;
    this.setState({
      loading: true,
      loadingTip: intl.formatMessage({id: 'hocs.route.deployingTip'}),
    });
    deploy(routes[0])
      .then(this.success)
      .catch(this.fail);
  }

  reset = () => {
    const {routes, reset, intl} = this.props;
    this.setState({
      loading: true,
      loadingTip: intl.formatMessage({id: 'hocs.route.resetingTip'}),
    });
    reset(routes[0])
      .then(this.success)
      .catch(this.fail);
  }

  success = () => {
    this.setState({
      loading: false
    }, () => setTimeout(this.back, 400));
  }

  fail = () => {
    this.setState({
      loading: false
    });
  }

  render() {
    const {title, description, schema, routes, routerParams, intl} = this.props;
    const {loading, loadingTip} = this.state;
    const key = routes[0];
    const item = schema[key];
    const breadcrumbs = [{
      path: 'home',
      render: () => <Icon type="home" />
    }, {
      path: routes[0],
      render: () => getRouteName(routes[0])
    }];
    const itemRender = (route) => {
      return route.render();
    }
    return <div>
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #eee',
        padding: '16px 24px'
      }}>
        <div style={{
          marginBottom: 24
        }}>
          <Breadcrumb itemRender={itemRender} routes={breadcrumbs} />
        </div>
        <h2>{item.title || title}</h2>
        {
          (item.description || description) && (
            <div style={{
              marginTop: 8
            }}>
              {item.description || description}
            </div>
          )
        }
      </div>
      <div style={{
        margin: '16px',
        padding: '16px',
        background: '#fff',
      }}>
        <Button
          onClick={this.back}
          style={{
            marginBottom: 16,
            width: 99,
            display: routerParams.operator === 'create' || routes.length > 1 ? undefined : 'none',
          }}
        >
          <Icon type="arrow-left" />
          Back
        </Button>
        <AddButton
          add={this.add}
          display={routes.length === 1 && routerParams.operator !== 'create' ? 'flex' : 'none'}
        />
        <Spin tip={loadingTip} spinning={loading}>
          <Item hideBackButton hideButtons/>
          <ButtonWrapper visible={(routes.length > 1 || routerParams.operator === 'create') && routes[0] != 'buildImage'}>
            <Button href="#" style={{marginRight: 16}} type="primary" onClick={this.deploy} data-testid="confirm-button">
              {intl.formatMessage({id: 'hocs.route.confirmText'})}
            </Button>
            <Button onClick={this.reset} data-testid="reset-button">
              {intl.formatMessage({id: 'hocs.route.resetText'})}
            </Button>
          </ButtonWrapper>
        </Spin>
      </div>
    </div>;
  }
}
