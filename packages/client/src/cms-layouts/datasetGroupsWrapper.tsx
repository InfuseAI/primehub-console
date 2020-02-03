import * as React from 'react';
import {get} from 'lodash';
import {Item} from 'canner-helpers';

function getDisplayTableType(recordValue) {
  if (recordValue.global && recordValue.type !== 'pv') {
    return {
      readOnly: false,
      writable: false
    };
  }
  if (!recordValue.global && recordValue.type !== 'pv') {
    return {
      readOnly: true,
      writable: false
    };
  }
  if (!recordValue.global && recordValue.type === 'pv') {
    return {
      readOnly: true,
      writable: true
    };
  }
  if (recordValue.global && recordValue.type === 'pv') {
    return {
      readOnly: false,
      writable: true
    }
  }
}

type Props = any;
type State = {
  recordValue: Record<string, any>;
};

export default class DatasetGroupsWrapper extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      recordValue: {}
    };
  }


  componentDidMount() {
    const {subscribe, refId, onDeploy} = this.props;
    const path = refId.getPathArr().slice();
    path.splice(1, 0, 'edges');
    path.splice(3, 0, 'node');
    // path: ["dataset", "edges", "0", "node"]

    subscribe(path[0], data => {
      const recordValue = get(data, path, {});
      this.setState({
        recordValue
      });
    });
  }

  render() {
    const {recordValue} = this.state;
    const {readOnly, writable} = getDisplayTableType(recordValue);
    return (
      // use `key` to force remount Item, so the UI re-renders
      <Item readOnly={readOnly} writable={writable} key={`${readOnly}/${writable}`} />
    )
  }
}
