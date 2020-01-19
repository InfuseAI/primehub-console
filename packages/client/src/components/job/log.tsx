import * as React from 'react';
import { Input } from 'antd';
import {get} from 'lodash';

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
    this.retryCount = 0;
    this.state = {
      log: ''
    };
  }

  fetchLog = () => {
    const token = window.localStorage.getItem('canner.accessToken');
    const {value} = this.props;
    const that = this;
    fetch(value, {
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
            log: `Error: cannot get log because ${reason}`
          }));
        });
      const reader = res.body.getReader();

      // cleanup logs
      that.setState({
        log: ''
      });

      return readChunk();

      function readChunk() {
        return reader.read().then(appendChunks).catch(err => {
          console.log(err);
          that.fetchLog();
        });
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
    })
    .catch(err => {
      console.log(err);
      setTimeout(() => {
        if (this.retryCount <= 5) {
          this.retryCount += 1;
          that.fetchLog();
        } else {
          console.log(`stop retrying fetching logs`);
        }
      }, 1000 * (this.retryCount + 1));
    });
  }

  componentDidMount() {
    this.fetchLog();
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
