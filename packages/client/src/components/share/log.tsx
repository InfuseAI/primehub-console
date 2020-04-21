import * as React from 'react';
import {Input, Button} from 'antd';
import {get, throttle} from 'lodash';

type Props = {
  endpoint: string;
  rows?: number;
}

type State = {
  log: string;
  autoScroll: boolean;
  tailLines?: number;
}

const APPEND_LENGTH = 100;
const INITIAL_LENGTH = 200;

export default class Logs extends React.Component<Props, State> {
  retryCount: number;
  myRef: React.Ref<HTMLTextAreaElement>;
  controller: AbortController;
  waitForChangeScrollTop: boolean;

  constructor(props) {
    super(props);
    this.retryCount = 0;
    this.state = {
      log: '',
      autoScroll: true,
      tailLines: INITIAL_LENGTH,
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
        log: '',
        autoScroll: true,
        tailLines: INITIAL_LENGTH
      }, () => {
        this.fetchLog();
        this.listenOnScrollToTOP();
      });
    }

    if (this.myRef.current && prevState.tailLines !== this.state.tailLines) {
      this.waitForChangeScrollTop = true;
      this.fetchLog();
      this.listenOnScrollToTOP();
    }

    if (this.state.log !== prevState.log && this.waitForChangeScrollTop) {
      const lines = this.state.log.split('\n').length;
      if (lines >= APPEND_LENGTH) {
        this.myRef.current.textAreaRef.scrollTop = APPEND_LENGTH * 21;
        this.waitForChangeScrollTop = false;
      }
    }

    const restartAutoScroll = !prevState.autoScroll && this.state.autoScroll;
    // scroll log box to bottom
    if (this.myRef && ((this.state.log !== prevState.log && this.state.autoScroll) || restartAutoScroll)) {
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
            log: `Error: cannot get log due to ${reason}`
          }));
        });
      that.setState({log: ''});
      
      const reader = res.body.getReader();
      
      function readChunk() {
        return reader.read().then(appendChunks);
      }

      function appendChunks(result) {
        if (result.done)
          return 'done';
        const chunk = new TextDecoder().decode(result.value.buffer);
        
        that.setState((prevState: any) => ({
          log: prevState.log + chunk,
        }))

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
      // if scroll to topmost, then we should fetch more.
      if (scrollTop === 0) {
        this.updateTailLines()
      }
    }
  }

  updateTailLines = throttle(() => {
    this.setState(prevState => ({
      tailLines: prevState.log.split('\n').length + APPEND_LENGTH,
    }))
  }, 3000);

  enableAutoScroll = () => {
    this.setState({
      autoScroll: true
    });
  }

  render() {
    const {rows = 40} = this.props;
    const {log} = this.state;
    return <>
      <Button
        onClick={this.enableAutoScroll}
        style={{float: 'right', marginBottom: 4}}
      >
        Scroll to Bottom
      </Button>
      <Input.TextArea
        style={{
          background: 'black',
          color: '#ddd',
          fontFamily: 'monospace',
        }}
        rows={rows || 40}
        value={log}
        // @ts-ignore
        ref={this.myRef}
      />
    </>;
  }
}
