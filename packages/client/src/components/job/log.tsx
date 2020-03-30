import * as React from 'react';
import {Input, Button} from 'antd';
import {get} from 'lodash';

type Props = {
  endpoint: string;
  rows?: number;
}

type State = {
  log: string;
  autoScroll: boolean;
}

export default class Logs extends React.Component<Props, State> {
  retryCount: number;
  myRef: React.Ref<HTMLTextAreaElement>;

  constructor(props) {
    super(props);
    this.retryCount = 0;
    this.state = {
      log: '',
      autoScroll: true,
    };
    this.myRef = React.createRef();
  }

  componentDidMount() {
    this.fetchLog();
    this.listenOnScrollToTOP();
  }

  componentDidUpdate(_prevProps, prevState) {
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
        return reader.read().then(appendChunks);
      }

      function appendChunks(result) {
        if (result.done)
          return 'done';
        const chunk = new TextDecoder().decode(result.value.buffer);
        
        that.setState((prevState: any) => ({
          log: prevState.log + chunk
        }))

        return readChunk();
      }

      return readChunk();
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

    }
  }

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
