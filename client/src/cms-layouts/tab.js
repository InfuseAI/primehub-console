
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
    const {refId, goTo, routes} = this.props;
    this.setState({
      deploying: true
    })
    deploy(refId.getPathArr()[0])
      .then(() => {
        this.setState({
          deploying: false
        });
        goTo(routes[0]);
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
      .then(() => goTo(routes[0]));
  }

  render() {
    const {children, disabledKeysInCreate, params, refId} = this.props;
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
                  <TabPane key={i} tab={child.title}
                    disabled={isDisabled({
                      keys: disabledKeysInCreate,
                      params,
                      childKeyName: child.keyName
                    })}
                  >
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
  params,
  childKeyName
}) {
  if (params && params.op === 'create' &&
    keys.indexOf(childKeyName) !== -1
  ) {
    return true;
  }
  return false;
}