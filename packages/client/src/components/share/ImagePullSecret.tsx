import React from 'react';
import {Checkbox, Select, Spin, Input} from 'antd';
import gql from 'graphql-tag';
import {Query} from 'react-apollo';
import {FormattedMessage} from 'react-intl';

type Props = {
  onChange?: (value: string) => void;
  value?: string;
  title?: React.ReactNode;
  disabled?: boolean
}
type State = {
  checked: boolean
}

export default class ImagePullSecret extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      checked: Boolean(props.value)
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      this.setState({checked: Boolean(this.props.value)});
    }
  }

  handleCheck = (e: any) => {
    const {onChange} = this.props;
    const checked = e.target.checked;
    this.setState({checked});
    if (!checked) {
      onChange('');
    }
  }

  handleSelect = (value: string) => {
    const {onChange} = this.props;
    onChange(value);
  }

  render() {
    const {value, title, disabled} = this.props;
    const {checked} = this.state;
    return (
      <div style={{display: 'flex', alignItems:'center'}}>
        <Checkbox style={{marginRight: 8}} disabled={disabled} onChange={this.handleCheck} checked={checked}>
          {title}
        </Checkbox>
        {
          checked ? (
            <div style={{flex: 1}}>
              <Selector disabled={disabled} onChange={this.handleSelect} value={value} />
            </div>
          ): (
            <Input disabled style={{flex: 1}} />
          )
        }
      </div>
    );
  }
}

type SelectorProps = {
  value: string,
  disabled: boolean;
  onChange: (value: string) => void
}

const GET_SECRET = gql`
{
  secrets(where: {ifDockerConfigJson: true}) {
    id
    name
    type
  }
}
`;

export class Selector extends React.Component<SelectorProps> {
  render() {
    const {value, onChange, disabled} = this.props;
    return (
      <Query query={GET_SECRET}>
        {({data, loading}) => (
          <Select
            disabled={disabled}
            style={{width: '100%'}}
            value={value ? value : undefined}
            onChange={onChange}
            placeholder={
              <FormattedMessage
                id="image.useImagePullSecret.component.select.placeholder"
                defaultMessage="Select Secret"
              />
            }
            notFoundContent={loading ? <Spin size="small" /> : null}
          >
            {!loading && data.secrets.map(d => (
              <Select.Option key={d.id}>{d.name}</Select.Option>
            ))}
          </Select>
        )}
      </Query>
    )
  }
}
