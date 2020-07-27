import React from 'react';
import ReactDOM from 'react-dom'

type Props = {};
type State = {
  iFrameHeight: string
}

export default class Home extends React.Component<Props,State> {

  constructor(props) {
    super(props);
    this.state = {
        iFrameHeight: '1000px',
    }
  }

  render() {
    return (
      <iframe
        style={{width:'100%', height:this.state.iFrameHeight, overflow:'visible'}}
        // onLoad={() => {
        //     const obj = ReactDOM.findDOMNode(this);
        //     this.setState({
        //         "iFrameHeight":  obj.contentWindow.document.body.scrollHeight + 'px'
        //     });
        // }}
        ref="iframe"
        src="/hub/home"
        width="100%"
        height={this.state.iFrameHeight}
        scrolling="no"
        frameBorder="0"
    />
    );
  }
}
