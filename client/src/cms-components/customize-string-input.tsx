import React from 'react';
import {Input} from 'antd';
import {FormattedMessage} from 'react-intl';
import {Props} from './types';
import styled from 'styled-components';

interface TitleProps {
  layout?: string;
  required?: boolean;
  title?: string;
}

interface State {
}

const Title = styled.div`
  color: rgba(0, 0, 0, 0.85);
  padding: ${(props: TitleProps) => props.layout === 'horizontal' ? 0 : '0 0 8px'};
  & > span:before {
    content: ${(props: TitleProps) => props.required && props.title ? '"* "' : '""'};
    color:red;
  }
`;

const LeftCharacter = styled.span`
  color: #ccc;
  position: relative;
  left: 16px;
`


export default class InputMaxLength extends React.Component<Props, State> {
  onChange = (e: any) => {
    this.props.onChange(this.props.refId, "update", e.target.value.substr(0, 40));
  };

  render() {
    const {value, title} = this.props;
    return (
      <>
        <Title>
          {title}
          <LeftCharacter>
            <FormattedMessage
              id="characters.remaining"
            />
            {40 - value.length})
          </LeftCharacter>
        </Title>
        <Input
          value={value}
          onChange={this.onChange}
        />
      </>
    );
  }
}