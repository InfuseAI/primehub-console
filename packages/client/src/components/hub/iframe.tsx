import React from 'react';

type Props = {
  src: string
};

export default class IFrame extends React.Component<Props> {

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
