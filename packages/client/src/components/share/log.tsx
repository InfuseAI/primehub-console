import * as React from 'react';
import {FixedSizeList as List} from 'react-window';
import {Button, Icon} from 'antd';
import {get} from 'lodash';
import downloadjs from 'downloadjs';
import styled from 'styled-components';
import moment from 'moment';

type Props = {
  endpoint: string;
  allowPersistLog?: Function;
  rows?: number;
  style?: React.CSSProperties;
  retryAfterTermintated?: boolean;
}

type State = {
  log: Array<string>;
  topmost: boolean;
  autoScroll: boolean;
  tailLines?: number;
  loading: boolean;
  loaded: boolean;
  downloading: boolean;
  fromPersist: boolean;
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class Logs extends React.Component<Props, State> {
  retryCount: number;
  listRef: React.RefObject<any>;
  outerRef: React.RefObject<any>;
  controller: AbortController;
  unmounted: boolean;

  constructor(props) {
    super(props);
    this.retryCount = 0;
    this.state = {
      log: [],
      autoScroll: true,
      tailLines: INITIAL_LENGTH,
      loading: true,
      loaded: false,
      downloading: false,
      topmost: false,
      fromPersist: false,
    };
    this.listRef = React.createRef();
    this.outerRef = React.createRef();
  }

  componentDidMount() {
    this.refetch();
    this.scrollToBottom();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.endpoint !== this.props.endpoint) {
      this.setState({log:[], loaded:false})
      this.refetch();
    }

    const restartAutoScroll = !prevState.autoScroll && this.state.autoScroll;
    // scroll log box to bottom
    if (((this.state.log[this.state.log.length - 1] !== prevState.log[prevState.log.length - 1] && this.state.autoScroll) || restartAutoScroll)) {
      //https://github.com/ant-design/ant-design/issues/10527
      // @ts-ignore
      this.scrollToBottom();
    }
  }

  componentWillUnmount() {
    if (this.controller) this.controller.abort();
    this.unmounted = true;
  }

  scrollToBottom = () => {
    if (!this.listRef.current) return;
    this.listRef.current.scrollToItem(this.outerRef.current.scrollHeight - this.outerRef.current.clientHeight)
  }

  appendNewLog = (chunk: string) => {
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

  refetch() {
    this.setState({
      loading: true,
      tailLines: INITIAL_LENGTH
    });

    this.fetchLog().then(() => {
      if (this.unmounted) {
        return;
      }
      // schedule next fetch if
      if (!this.state.loaded || this.props.retryAfterTermintated) {
        setTimeout(()=> {
          this.refetch();
        }, 5000);
      }
    });
  }

  fetchLog = async () => {
    const token = window.localStorage.getItem('canner.accessToken');
    const {endpoint} = this.props;
    const {tailLines} = this.state;
    if (this.controller) this.controller.abort();
    const controller = new AbortController();
    this.controller = controller
    const signal = controller.signal;
    if (!endpoint) return;


    let retryCount = 0;
    let res: Response;

    // Fetch the log
    while (true) {
      try {
        res = await fetch(`${endpoint}?tailLines=${tailLines}&follow=true`, {
          signal,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + token
          },
        });

        if (res.status >= 400) {
          let allowPerist = this.props.allowPersistLog?
            this.props.allowPersistLog() :
            false;
          if (allowPerist && this.state.loaded == false) {
            this.setState({fromPersist: true});
            res = await fetch(`${endpoint}?tailLines=${tailLines}&persist=true`, {
              signal,
              method: 'GET',
              headers: {
                'Authorization': 'Bearer ' + token
              },
            });
          } else {
            const content = await res.json();
            const reason = get(content, 'message', 'of internal error');
            if (this.state.loaded == false) {
              this.setState(() => ({
                log: [`Error: cannot get log due to ${reason}`],
                loading: false
              }));
            }
            return;
          }
        }
        this.setState({
          loading: false
        })
        break;
      } catch (err) {
        if (err.message === 'The user aborted a request.') {
          return;
        }
        console.log(err);
        if (this.state.loaded == false) {
          this.setState(() => ({
            log: [`Error: cannot fetch the log`]
          }));
        }

        retryCount++;
        if (retryCount === 5) {
          console.log(`stop retrying fetching logs`);
          return;
        }

        await sleep(3000);
      }
    }

    // Keep reading the trunk
    this.setState({log: []});
    const reader = res.body.getReader();
    try {
      while (true) {
        let result = await reader.read();
        if (result.done) {
          break;
        }
        const chunk = new TextDecoder().decode(result.value.buffer);
        this.appendNewLog(chunk);
      }
    } finally {
      this.setState({loaded: true});
    }
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
    let url = `${endpoint}?follow=false`;
    if (this.state.fromPersist) {
      url += '&persist=true';
    }

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      },
    }).then(res => res.blob())
    .then(blob => {
      return downloadjs(
        blob, `${moment(new Date().toISOString()).format('YYYY-MM-DD-HH-mm-ss')}.log`, 'text/plain');
    })
    .finally(() => {
      this.setState({downloading: false});
    })
  }

  render() {
    const {endpoint, rows = 40, style = {}} = this.props;
    const {log, loading, downloading, fromPersist} = this.state;
    const hints = [];
    hints.push('Please download the log to view more than 2000 lines.');

    let listItems = log;
    if (listItems.length == 0) {
      listItems = loading ? ['loading...'] : ['(no data)'];
    }
    const listStyle = {
      background: 'black',
      color: log.length > 0 ? '#ddd' : '#888',
      fontFamily: 'monospace',
      border: 0,
    };

    if (endpoint && endpoint.includes('phdeployments'))
      hints.push('Timestamp reflects Universal Time Coordinated (UTC).');
    if (fromPersist)
      hints.push('Log content may be delayed by up to 1 hour because the pod was deleted.');
    return <>
      <div style={{float: 'right', marginBottom: 4, display: 'flex'}}>
        <Button
          onClick={this.download}
          style={{marginRight: 8}}
          disabled={ log.length <= 0 }
          loading={downloading}
        >
          Download
        </Button>
        <Button
          onClick={this.enableAutoScroll}
          disabled={ log.length <= 0 }
        >
          Scroll to Bottom
        </Button>
      </div>
      <div style={{position: 'relative', marginTop: 48, ...style}}>
        <Hint>
          {hints.map((hint) => (
            <div style={{display: "flex"}}>
              <Icon type="info-circle" theme="twoTone" style={{marginTop: 4}}/><div style={{marginLeft: 4, flex: "0 0 100%"}}>{hint}</div>
            </div>))
          }
        </Hint>

        <List
          style={listStyle}
          onScroll={this.onScroll}
          ref={this.listRef}
          outerRef={this.outerRef}
          height={rows * LINE_HEIGHT}
          itemCount={listItems.length}
          itemSize={LINE_HEIGHT}
        >
          {({index, style}) => <div key={index} style={{
            ...style,
            padding: '0px 12px',
            overflow: 'visible',
            whiteSpace: 'nowrap'
          }}>{handleLong(listItems[index])}</div>}
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
