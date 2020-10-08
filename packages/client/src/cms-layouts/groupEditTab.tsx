import * as React from 'react';
import {Tabs, Button, Spin} from 'antd';
import {Item} from 'canner-helpers';
import {injectIntl} from 'react-intl';
import RefId from 'canner-ref-id';
const TabPane = Tabs.TabPane;

type Props = {
  routerParams: {
    operator: string;
    payload: Record<string, any>;
  },
  goTo: Function;
  routes: Array<string>;
  refId: RefId;
  reset: Function;
  deploy: (key: string) => Promise<any>;
  intl: any;
}

@injectIntl
export default class ImageJobTab extends React.Component<Props> {
  state = {
    loading: false,
    loadingTip: null
  };

  onChangeTab = (keyName: string) => {
    const {goTo, routerParams, routes} = this.props;
    const payload = routerParams.payload || {};
    goTo({
      pathname: routes.join('/'),
      ...routerParams,
      payload: {
        ...payload,
        tab: keyName
      }
    });
  }

  deploy = () => {
    const {refId, deploy, intl} = this.props;
    this.setState({
      loading: true,
      loadingTip: intl.formatMessage({id: 'hocs.route.deployingTip'}),
    });
    deploy(refId.getPathArr()[0])
      .then(this.success)
      .catch(this.fail);
  }

  reset = () => {
    const {refId, reset, intl} = this.props;
    this.setState({
      loading: true,
      loadingTip: intl.formatMessage({id: 'hocs.route.resetingTip'}),
    });
    reset(refId.getPathArr()[0])
      .then(this.success)
      .catch(this.fail);
  }

  success = () => {
    const {goTo, routes} = this.props;
    setTimeout(() => {
      this.setState({
        loading: false
      }, () => {
        goTo({pathname: routes[0]});
      });
    }, 400);
  }

  fail = () => {
    this.setState({
      loading: false
    });
  }

  render() {
    const {children, routerParams, intl} = this.props;
    const {loading, loadingTip} = this.state;
    const payload = routerParams.payload || {};
    return (
      <Spin spinning={loading} tip={loadingTip}>
        <Tabs activeKey={payload.tab || 'info'} onChange={this.onChangeTab}>
          {
            children
              .filter(child => {
                if (routerParams.operator === 'create' && child.keyName === 'jobs') {
                  // hide jobs tab in create form
                  return false;
                }
                if (child.match && !child.match()) {
                  return false;
                }
                return true;
              })
              .map((child, i) => (
              <TabPane key={child.keyName} tab={child.title} data-testid={`tabs-${child.keyName}`} >
                <Item
                  hideTitle={true}
                  filter={node => node.keyName === child.keyName}
                  hideButtons
                />
                {
                  child.keyName === 'info' && (
                    <div style={{textAlign: 'right'}}>
                      <Button style={{marginRight: 16}} type="primary" onClick={this.deploy} data-testid="confirm-button">
                        {intl.formatMessage({id: 'hocs.route.confirmText'})}
                      </Button>
                      <Button onClick={this.reset} data-testid="reset-button">
                        {intl.formatMessage({id: 'hocs.route.resetText'})}
                      </Button>
                    </div>
                  )
                }
              </TabPane>
            ))
          }
        </Tabs>
      </Spin>
    )
  }
}
