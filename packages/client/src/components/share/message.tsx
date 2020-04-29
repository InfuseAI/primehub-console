import * as React from 'react';

type Props = {
  text: string;
  extra?: any;
  style?: object;
}

type State = {
  hidden: boolean;
}

function renderTexts(texts: Array<string>) {
  return (
    <React.Fragment>
      {texts.map((text, i) => <div key={i}>{text}</div>)}
    </React.Fragment>
  )
}

export default class Message extends React.Component<Props, State> {
  showMaxLine = 4;
  state = {
    hidden: true
  }

  showMore = () => {
    this.setState({hidden: false});
  }

  showLess = () => {
    this.setState({hidden: true});
  }

  render() {
    const {text, extra, style = {}} = this.props;
    const {hidden} = this.state;
    const texts = (text || '').split('\n');
    return (
      <div style={{
        marginTop: '10px',
        lineHeight: '22px',
        ...style
      }}>
        {renderTexts(texts.slice(0, this.showMaxLine))}
        {
          (texts.length > this.showMaxLine && hidden) && (
            <a style={{display: 'block'}} href="#" onClick={this.showMore}>
              {`Show More >>`}
            </a>
          )
        }
        {
          (texts.length > this.showMaxLine && !hidden) && (
            <React.Fragment>
              {renderTexts(texts.slice(this.showMaxLine))}
              <a style={{display: 'block'}} href="#" onClick={this.showLess}>
                {`<< Show Less`}
              </a>
            </React.Fragment>
          )
        }
        {extra}
      </div>
    )
  }
}