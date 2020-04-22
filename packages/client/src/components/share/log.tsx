import * as React from 'react';
import {Input, Button} from 'antd';
import {get, throttle} from 'lodash';
import downloadjs from 'downloadjs';

type Props = {
  endpoint: string;
  rows?: number;
  style?: object;
}

type State = {
  log: Array<string>;
  topmost: boolean;
  autoScroll: boolean;
  tailLines?: number;
  downloading: boolean;
}

const INITIAL_LENGTH = 2000;

export default class Logs extends React.Component<Props, State> {
  retryCount: number;
  myRef: React.Ref<HTMLTextAreaElement>;
  controller: AbortController;

  constructor(props) {
    super(props);
    this.retryCount = 0;
    this.state = {
      log: [],
      autoScroll: true,
      tailLines: INITIAL_LENGTH,
      downloading: false,
      topmost: false,
    };
    this.myRef = React.createRef();
  }

  componentDidMount() {
    this.fetchLog();
    this.listenOnScrollToTOP();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.endpoint !== this.props.endpoint) {
      this.setState({
        log: [],
        autoScroll: true,
        tailLines: INITIAL_LENGTH
      }, () => {
        this.fetchLog();
        this.listenOnScrollToTOP();
      });
    }

    const restartAutoScroll = !prevState.autoScroll && this.state.autoScroll;
    // scroll log box to bottom
    if (this.myRef && ((this.state.log[this.state.log.length - 1] !== prevState.log[prevState.log.length - 1] && this.state.autoScroll) || restartAutoScroll)) {
      //https://github.com/ant-design/ant-design/issues/10527
      // @ts-ignore
      this.myRef.current.textAreaRef.scrollTop = this.myRef.current.textAreaRef.scrollHeight;
    }
  }

  fetchLog = () => {
    const token = window.localStorage.getItem('canner.accessToken');
    const {endpoint} = this.props;
    const {tailLines} = this.state;
    const that = this;
    if (this.controller) this.controller.abort();
    const controller = new AbortController();
    this.controller = controller
    const signal = controller.signal;
    if (!endpoint) return;
    return fetch(`${endpoint}?tailLines=${tailLines}`, {
      signal,
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
            log: [`Error: cannot get log due to ${reason}`]
          }));
        });
      that.setState({log: []});
      
      const reader = res.body.getReader();
      
      function readChunk() {
        return reader.read().then(appendChunks);
      }

      function appendChunks(result) {
        if (result.done)
          return 'done';
        const chunk = new TextDecoder().decode(result.value.buffer).split('\n');
        if (!chunk[chunk.length - 1]) chunk.pop();
        
        that.setState((prevState: any) => {
          const log = prevState.log.length > 2000 ?
          prevState.log.slice(chunk.length) : 
          prevState.log;
          return {
            log: [...log, ...chunk],
          }
        }, () => {
          if (!that.state.autoScroll && that.state.log.length >= 2000) {
            that.myRef.current.textAreaRef.scrollTop -= chunk.length * 21;
          }
        });

        return readChunk();
      }

      return readChunk();
    })
    .catch(err => {
      if (err.message === 'The user aborted a request.') {
        return;
      }
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

  listenOnScrollToTOP = () => {
    // @ts-ignore
    this.myRef.current.textAreaRef.onscroll = () => {
      const {
        clientHeight,
        scrollTop,
        scrollHeight
      } = this.myRef.current.textAreaRef;
      if (scrollHeight > clientHeight + scrollTop) {
        this.setState({autoScroll: false})
      }

      this.setState({
        topmost: scrollTop === 0
      });
    }
  }

  enableAutoScroll = () => {
    this.setState({
      autoScroll: true
    });
  }

  download = () => {
    const {endpoint} = this.props;
    const {tailLines} = this.state;
    const token = window.localStorage.getItem('canner.accessToken');
    this.setState({downloading: true});
    fetch(`${endpoint}?follow=true&&tailLines=${tailLines}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      },
    }).then(res => res.blob())
    .then(blob => {
      return downloadjs(blob, 'deployment.log', 'text/plain');
    })
    .finally(() => {
      this.setState({downloading: false});
    })
  }

  render() {
    const {rows = 40, style = {}} = this.props;
    const {log, downloading, topmost} = this.state;
    return <>
      <div style={{float: 'right', marginBottom: 4, display: 'flex'}}>
        <Button
          onClick={this.download}
          style={{marginRight: 8}}
          loading={downloading}
        >
          Download
        </Button>
        <Button
          onClick={this.enableAutoScroll}
        >
          Scroll to Bottom
        </Button>
      </div>
      <div style={{position: 'relative', marginTop: 48, ...style}}>
        <div
          style={{
            padding: 16,
            position: 'absolute',
            width: '100%',
            top: 0,
            zIndex: 1,
            background: '#eee',
            letterSpacing: '0.4px',
            opacity: topmost && log.length >= 2000 ? 1 : 0,
            color: '#333',
            transition: 'opacity 0.1s',
          }}
        >
          Please download to check out more than 2000 lines.
        </div>
        <Input.TextArea
          style={{
            background: 'black',
            color: '#ddd',
            fontFamily: 'monospace',
            border: 0
          }}
          rows={rows || 40}
          value={log.join('\n')}
          // @ts-ignore
          ref={this.myRef}
        />
      </div>
    </>;
  }
}
