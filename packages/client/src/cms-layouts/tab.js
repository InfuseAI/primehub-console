
import * as React from 'react';
import {Tabs, Button, Spin} from 'antd';
import {Item, Context} from 'canner-helpers';
import {HOCContext} from 'canner/lib/hocs/context';
import styled from 'styled-components';

const TabPane = Tabs.TabPane;
const ButtonWrapper = styled.div`
  text-align: right;
`
export default class Tab extends React.Component {
  state = {
    deploying: false
  }

  deploy = deploy => {
    const {refId, goTo, routes, routerParams: {operator}} = this.props;
    this.setState({
      deploying: true
    })
    deploy(refId.getPathArr()[0])
      .then(() => {
        this.setState({
          deploying: false
        });
        goTo({pathname: routes[0]});
      })
      .catch(() => {
        this.setState({
          deploying: false
        });
      });
  }

  reset = reset => {
    const {refId, goTo, routes} = this.props;
    reset(refId.getPathArr()[0])
      .then(() => goTo({pathname: routes[0]}));
  }

  render() {
    const {children, disabledKeysInCreate, routerParams, refId} = this.props;
    const {deploying} = this.state;
    const key = refId.getPathArr()[0];
    return (
      <Spin tip="deploying" spinning={deploying}>
      <HOCContext.Consumer>
        {
          props => {
            return <Tabs>
              {
                children.map((child, i) => (
                  !isDisabled({
                    keys: disabledKeysInCreate,
                    routerParams,
                    childKeyName: child.keyName
                  }) && <TabPane key={i} tab={child.title}>
                    <Item
                      hideTitle={true}
                      filter={node => node.keyName === child.keyName}
                    />
                    {
                      child.keyName === 'basicInfo' && <ButtonWrapper>
                        <Button style={{marginRight: 16}} type="primary" onClick={() => this.deploy(props.deploy)}>Confirm</Button>
                        <Button onClick={() => this.reset(props.reset)}>Reset</Button>
                      </ButtonWrapper>
                    }
                  </TabPane>
                ))
              }
              
            </Tabs>
          }
        }
        
      </HOCContext.Consumer>
      </Spin>
    )
  }
}

function isDisabled({
  keys,
  routerParams,
  childKeyName
}) {
  if (routerParams && routerParams.operator === 'create' &&
    keys.indexOf(childKeyName) !== -1
  ) {
    return true;
  }
  return false;
}