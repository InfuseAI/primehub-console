import * as React from 'react';
import { Input } from 'antd';
import { get } from 'lodash';
import RefId from 'canner-ref-id';
import { FormattedHTMLMessage } from 'react-intl';

type Props = {
  refId: RefId;
  value: string;
  rootValue: Record<string, any>;
  onChange: (refId: RefId, action: string, value: string) => Promise<void>;
  subscribe: (key: string, callback: Function) => void;
}

type State = {
  name: string;
}

export default class MountRoot extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const {rootValue, refId} = this.props;
    const name = get(rootValue, refId.remove(1).child('name').getPathArr(), '');
    this.state = {
      name: name
    }
  }

  componentDidMount() {
    const {subscribe, refId} = this.props;
    const path = refId.remove().child('name').getPathArr() as Array<string>;
    path.splice(1, 0, 'edges');
    path.splice(3, 0, 'node');
    // path: ["dataset", "edges", "0", "node", "name"]
    subscribe(path[0], (value: any) => {
      this.setState({
        name: get(value, path, '')
      });
    });
  }

  onChange = (e: any) => {
    const {refId, onChange} = this.props;
    onChange(refId, 'update', e.target.value);
  }

  render() {
    const {value, disabled} = this.props;
    const {name} = this.state;
    return (
      <>
        <Input
          disabled={disabled}
          value={value}
          onChange={this.onChange}
        />
        <Preview name={name} root={value} />
      </>
    )
  }
}

function Preview({
  name,
  root
}: {
  name: string,
  root: string
}) {
  return (
    <div style={{
      color: '#aaa',
      fontSize: 12,
      marginTop: 8
    }}>
      <FormattedHTMLMessage
        id="mountRoot.preview"
        defaultMessage="Data can be access at: "
      />
      {`${root.replace(/\/$/, '')}/${name}`}
    </div>
  )
}