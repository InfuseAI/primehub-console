import * as React from 'react';
import {Breadcrumb, Icon, Button, Spin, Alert, Modal} from 'antd';
import {Item} from 'canner-helpers';
import {injectIntl} from 'react-intl';
import styled from 'styled-components';
import {get, startCase} from 'lodash';
import AddButton from './addButtton';
import {Props} from '../cms-components/types';

const confirm = Modal.confirm;

const DISABLE_BUILD_IMAGE = !(window as any).customImageSetup;

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
    let backTo = get(routerParams, 'payload.backTo', '');
    if (groupId) backTo = `group/${groupId}`
    if (backTo) return goTo({ pathname: backTo });
    goTo({ pathname: routes[0] })
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

  discard = () => {
    const {goTo, routes, routerParams, reset, refId, dataChanged, intl} = this.props;
    if (dataChanged && Object.keys(dataChanged).length > 0) {
      confirm({
        title: intl.formatMessage({id: 'hocs.route.confirm.title'}),
        content: intl.formatMessage({id: 'hocs.route.confirm.content'}),
        okText: intl.formatMessage({id: 'hocs.route.confirm.okText'}),
        cancelText: intl.formatMessage({id: 'hocs.route.confirm.cancelText'}),
        onOk: () => {
          return new Promise(resolve => {
            setTimeout(resolve, 200);
          }).then()
            .then(() => {
              this.reset();
            });
        },
        onCancel: () => {
        },
      });
    } else {
      this.reset();
    }
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
    const groupId = get(routerParams, 'payload.backToGroup', '');
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

    let customImageAlert = undefined;
    if (key === 'buildImage' && DISABLE_BUILD_IMAGE === true) {
      let desc = <span>{intl.formatMessage({id: 'buildImage.msg.pleaseCheckSetup'})} <a href={intl.formatMessage({id: 'buildImage.msg.regsitrySetupLink'})} target="_blank">More Info</a></span>;
      customImageAlert = <Alert
          message="Warning"
          description={desc}
          type="warning"
          showIcon
        />;
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
      {customImageAlert}
      <div style={{
        margin: '16px',
        padding: '16px',
        background: '#fff',
      }}>
        <Button
          onClick={this.discard}
          style={{
            marginBottom: 16,
            minWidth: 99,
            display: routerParams.operator === 'create' || routes.length > 1 ? undefined : 'none',
          }}
        >
          <Icon type="arrow-left" />
          { groupId ? 
            ` Back to group`:
            ' Back'
          }
        </Button>
        <AddButton
          add={this.add}
          keyName={key}
          display={routes.length === 1 && routerParams.operator !== 'create' ? 'flex' : 'none'}
        />
        <Spin tip={loadingTip} spinning={loading}>
          <Item hideBackButton hideButtons/>
          <ButtonWrapper visible={(routes.length > 1 || routerParams.operator === 'create') && routes[0] != 'buildImage' && routes[0] != 'group'}>
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
