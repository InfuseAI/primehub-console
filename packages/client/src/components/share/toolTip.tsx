import React from 'react';
import {Tooltip, Icon} from 'antd';
import {LightA} from 'components/share';

interface Props {
  tipText: string;
  tipLink: string;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  style?: any;
}

class PHTooltip extends React.Component<Props> {
  render() {
    const {tipText, tipLink, placement = 'top', style} = this.props;
    const tipTitle = <span>{tipText} <LightA href={tipLink} target='_blank'>Learn More.</LightA></span>;
    return (
      <Tooltip placement={placement} title={tipTitle}>
        <Icon type='question-circle' style={style}/>
      </Tooltip>
    );
  }
}

export default PHTooltip;
