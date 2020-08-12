import React from 'react';
import ReactDOM from 'react-dom';

type Props = {
  src: string
};

type State = {
};

export default class Home extends React.Component<Props,State> {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {src} = this.props;

    return (
      <div style={{width:"100%",height:"100%"}}>
        <iframe
          ref="iframe"
          src={src}
          width="100%"
          height="100%"
          style={{overflow:"hidden"}}
          scrolling="auto"
          frameBorder="0"
        />
      </div>
    );
  }
};
