import * as React from 'react';
import {FixedSizeList as List} from 'react-window';
import {Button} from 'antd';
import {get} from 'lodash';
import downloadjs from 'downloadjs';
import styled from 'styled-components';

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

const Hint = styled.div`
  padding: 4px 12px;
  width: 100%;
  top: 0;
  z-index: 1;
  background: #eee;
  letter-spacing: 0.4px;
  opacity: ${(props: any) => props.opacity ? 0 : 1};
  color: #333;
  transition: opacity 0.1s;
` as any;

const INITIAL_LENGTH = 2000;

const LINE_HEIGHT = 21;

export default class Logs extends React.Component<Props, State> {
  retryCount: number;
  listRef: React.RefObject<any>;
  outerRef: React.RefObject<any>;
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
    this.listRef = React.createRef();
    this.outerRef = React.createRef();
  }

  componentDidMount() {
    this.fetchLog();
    this.scrollToBottom();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.endpoint !== this.props.endpoint) {
      this.setState({
        log: [],
        autoScroll: true,
        tailLines: INITIAL_LENGTH
      }, () => {
        this.fetchLog();
      });
    }

    const restartAutoScroll = !prevState.autoScroll && this.state.autoScroll;
    // scroll log box to bottom
    if (((this.state.log[this.state.log.length - 1] !== prevState.log[prevState.log.length - 1] && this.state.autoScroll) || restartAutoScroll)) {
      //https://github.com/ant-design/ant-design/issues/10527
      // @ts-ignore
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    if (!this.listRef.current) return;
    this.listRef.current.scrollToItem(this.outerRef.current.scrollHeight - this.outerRef.current.clientHeight)
  }

  showNewLog = (chunk: string) => {
    const newLog = chunk.split(/[\n\r]+/);
    if (!newLog[newLog.length - 1]) newLog.pop();
    this.setState((prevState: any) => {
      const log = prevState.log.length >= 2000 ?
      prevState.log.slice(newLog.length) : 
      prevState.log;
      return {
        log: [...log, ...newLog],
      }
    }, () => {
      if (!this.state.autoScroll && this.state.log.length >= 2000) {
        this.listRef.current.scrollTo(this.outerRef.current.scrollTop - newLog.length * LINE_HEIGHT);
      }
    });
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
        const chunk = new TextDecoder().decode(result.value.buffer);
        that.showNewLog(chunk);

        return readChunk();
      }

      return readChunk();
    })
    .then(() => {
      setTimeout(() => {
        this.fetchLog();
      }, 10000);
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

  onScroll = ({
    scrollDirection,
    scrollOffset,
    scrollUpdateWasRequested
  }) => {
    if (!this.outerRef.current) return;
    if (scrollUpdateWasRequested) {
      return;
    }
    this.setState({
      topmost: scrollDirection === 'backward' && scrollOffset === 0,
      autoScroll: scrollDirection === 'forward' && this.outerRef.current.scrollHeight - this.outerRef.current.clientHeight === scrollOffset
    });
  }

  enableAutoScroll = () => {
    this.setState({
      autoScroll: true
    });
  }

  download = () => {
    const {endpoint} = this.props;
    const token = window.localStorage.getItem('canner.accessToken');
    this.setState({downloading: true});
    fetch(`${endpoint}?follow=false`, {
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
    const {log, downloading} = this.state;
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
        <Hint>
          Please download to check out more than 2000 lines.
        </Hint>
        <List
          style={{
            background: 'black',
            color: '#ddd',
            fontFamily: 'monospace',
            border: 0,
          }}
          onScroll={this.onScroll}
          ref={this.listRef}
          outerRef={this.outerRef}
          height={rows * LINE_HEIGHT}
          itemCount={log.length}
          itemSize={LINE_HEIGHT}
        >
          {({index, style}) => <div key={index} style={{
            ...style,
            padding: '0px 12px',
            overflow: 'visible',
          }}>{handleLong(log[index])}</div>}
        </List>
      </div>
    </>;
  }
}

function handleLong(log: string) {
  if (log.length > 200) {
    return log.slice(0, 30) + ` ...Download to see more... ` + log.slice(-30);
  }
  return log;
}
