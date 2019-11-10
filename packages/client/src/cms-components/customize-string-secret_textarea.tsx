import React from 'react';
import RefId from 'canner-ref-id';
import { Input } from 'antd';

const { TextArea } = Input;

interface State {
  editing: boolean;
}

interface Props {
  refId: RefId;
  onChange: (refId: RefId, type: string, value: any) => void;
  value: string;
  disabled: boolean;
  uiParams: {
    placeholder: string;
    rows?: number;
  };
}

export default class SecretTextarea extends React.Component<Props, State> {
  state = {
    editing: false
  };

  onChange = (e: any) => {
    const {refId, onChange} = this.props;
    const value = e.target.value;
    this.setState({
      editing: true
    }, () => {
      onChange(refId, 'update', value);
    });
  }

  render() {
    const {
      disabled,
      uiParams: {
        placeholder,
        rows = 6,
      },
      value
    } = this.props;
    const {
      editing
    } = this.state;
    return (
      <TextArea
        rows={rows}
        placeholder={value && placeholder}
        disabled={disabled}
        value={editing ? value : ''}
        onChange={this.onChange}
      />
    );
  }
}