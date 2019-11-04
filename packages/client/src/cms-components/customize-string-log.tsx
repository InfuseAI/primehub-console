import * as React from 'react';
import { Input } from 'antd';

export default class Logs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      log: ''
    };
  }

  componentDidMount() {
    const {value} = this.props;
    const that = this;
    fetch(value)
      .then(res => {
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
    const {uiParams} = this.props;
    const {log} = this.state;
    const {rows} = uiParams;
    return <Input.TextArea
      style={{
        background: 'black',
        color: '#ddd'
      }}
      rows={rows}
      value={log}
    />;
  }
}