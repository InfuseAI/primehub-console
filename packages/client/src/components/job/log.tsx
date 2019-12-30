import * as React from 'react';
import { Input } from 'antd';

type Props = {
  value: string;
  uiParams?: {
    rows?: number
  }
}

type State = {
  log: string;
}

export default class Logs extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      log: ''
    };
  }

  componentDidMount() {
    const token = window.localStorage.getItem('canner.accessToken');
    const {value} = this.props;
    const that = this;
    fetch(value, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      },
    }).then(res => {
      if (res.status > 400)
        return res.json().then(content => {
          that.setState(() => ({
            log: `Error: cannot get log. Because ${JSON.stringify(content || {}, null, 2)}`
          }));
        });
      const reader = res.body.getReader();

      return readChunk();

      function readChunk() {
        return reader.read().then(appendChunks);
      }

      function appendChunks(result) {
        if (!result.done){
          const chunk = new TextDecoder().decode(result.value.buffer);
          that.setState((prevState: any) => ({
            log: prevState.log + chunk
          }));
        }

        if (result.done) {
          return 'done';
        } else {
          return readChunk();
        }
      }
    });
  }

  render() {
    const {uiParams = {}} = this.props;
    const {log} = this.state;
    const {rows} = uiParams;
    return <Input.TextArea
      style={{
        background: 'black',
        color: '#ddd'
      }}
      rows={rows || 40}
      value={log}
    />;
  }
}