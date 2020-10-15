import * as React from 'react';
import {Breadcrumb, Icon, Button, Modal, Spin} from 'antd';
import {Item} from 'canner-helpers';
import {get} from 'lodash';
import AddButton from './addButtton';
import {DatasetBodyProps} from '../cms-components/types';
import {injectIntl} from 'react-intl';

const confirm = Modal.confirm;

@injectIntl
export default class DatasetBody extends React.Component<DatasetBodyProps> {
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
    const {dataChanged, intl} = this.props;
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

  add = () => {
    const {goTo, routes} = this.props;
    goTo({
      pathname: `${routes[0]}`,
      operator: 'create'
    });
  }

  render() {
    const {title, description, schema, routes, routerParams} = this.props;
    const {loading, loadingTip} = this.state;
    const key = routes[0];
    const item = schema[key];
    const groupId = get(routerParams, 'payload.backToGroup', '');
    const breadcrumbs = [{
      path: 'home',
      render: () => <Icon type="home" />
    }, {
      path: 'dataset',
      render: () => 'Datasets'
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
          display={routes.length === 1 && routerParams.operator !== 'create' ? 'flex' : 'none'}
          add={this.add}
        />
        <Spin tip={loadingTip} spinning={loading}>
          <Item hideBackButton hideButtons/>
        </Spin>
      </div>
    </div>;
  }
}
