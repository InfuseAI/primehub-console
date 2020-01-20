import * as React from 'react';
import {Input} from 'antd';
import {get} from 'lodash';

type Props = {
  endpoint: string;
  rows?: number
}

type State = {
  log: string;
}

export default class Logs extends React.Component<Props, State> {
  retryCount: number;

  constructor(props) {
    super(props);
    this.retryCount = 0;
    this.state = {
      log: ''
    };
  }

  componentDidMount() {
    this.fetchLog()
      .then(() => {
        this.retryCount = 0;
      })
      .catch(err => {
        console.log(err);
        setTimeout(() => {
          if (this.retryCount <= 5) {
            this.retryCount += 1;
            this.fetchLog();
          } else {
            console.log(`stop retrying fetching logs`);
          }
        }, 1000 * (this.retryCount + 1));
      });
  }

  fetchLog = () => {
    const token = window.localStorage.getItem('canner.accessToken');
    const {endpoint} = this.props;
    const that = this;
    return fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      },
    }).then(res => {
      this.retryCount = 0;
      if (res.status >= 400)
        return res.json().then(content => {
          const reason = get(content, 'message', 'of internal error');
          that.setState(() => ({
            log: `Error: cannot get log due to ${reason}`
          }));
        });
      
      that.setState({log: ''});
      const reader = res.body.getReader();
      
      function readChunk() {
        return reader.read().then(appendChunks).catch(err => {
          console.log(err);
          that.fetchLog();
        });
      }

      function appendChunks(result) {
        if (result.done)
          return 'done';
        const chunk = new TextDecoder().decode(result.value.buffer);
        that.setState((prevState: any) => ({
          log: prevState.log + chunk
        }));
        return readChunk();
      }

      return readChunk();
    })
  }

  render() {
    const {rows = 40} = this.props;
    const {log} = this.state;
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
