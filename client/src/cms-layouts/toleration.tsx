import * as React from 'react';
import {Item} from 'canner-helpers';
import {get} from 'lodash';
import {RefId} from 'canner-ref-id';

type Props = {
  subscribe: (keyName: string, callback: Function) => Promise<void>,
  refId: RefId,
  onDeploy: (keyName: string, callback: Function) => void,
}

type State = {
  key: string,
  value: string,
  operator: string,
  effect: string,
  remount: number
}

export default class TolerationLayout extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      key: '',
      value: '',
      operator: '',
      effect: '',
      remount: Math.random()
    };
  }

  componentDidMount() {
    const {subscribe, refId, onDeploy} = this.props;
    const path = refId.getPathArr().slice();
    path.splice(1, 0, 'edges');
    path.splice(3, 0, 'node');
    // path: ["instanceType", "edges", "0", "node", "tolerations", "0"]
    onDeploy(path[0], result => {
      this.setState({
        remount: Math.random()
      });
      return result;
    });
    subscribe(path[0], data => {
      const recordValue = get(data, path, {});
      this.setState((prevState: State) => ({...recordValue, prevKey: prevState.key}));
    });
  }
  render() {
    const {refId} = this.props;
    const {key, value, operator, remount, effect} = this.state;
    return (
      <>
        <Item
          filter={node => node.keyName === 'key'}
          // hack, remount when deploying to update error message
          relationValue={remount}
          required={operator === 'Equal' || !value}
        />
        <Item
          filter={node => (node.keyName === 'value')}
          // hack, remount when deploying to update error message
          relationValue={remount}
          required={operator === 'Equal'}
          disabled={operator === 'Exists'}
        />
        <Item
          filter={node => node.keyName === 'operator'}
        />
        <Item
          filter={node => node.keyName === 'effect'}
        />
      </>
    )
  }
}