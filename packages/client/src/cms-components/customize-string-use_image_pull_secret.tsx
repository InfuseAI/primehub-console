import React, { SyntheticEvent } from 'react';
import {Checkbox, Select, Spin} from 'antd';
import {Query} from 'react-apollo';
import gql from 'graphql-tag';
import {FormattedMessage} from 'react-intl';

type RefId = any;
type Props = {
  refId: RefId;
  onChange: (refId: RefId, actionType: string, value: string) => void;
  value: string;
  title: React.ReactNode;
  disabled: boolean
}
type State = {
  checked: boolean
}

export default class UseImagePullSecret extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      checked: Boolean(props.value)
    };
  }

  handleCheck = (e: any) => {
    const {refId, onChange} = this.props;
    const checked = e.target.checked;
    // we don't case about the async setState here
    this.setState({checked});
    if (!checked) {
      onChange(refId, 'update', null);
    }
  }

  handleSelect = (value: string) => {
    const {onChange, refId} = this.props;
    onChange(refId, 'update', value);
  }

  render() {
    const {value, title, disabled} = this.props;
    const {checked} = this.state;
    return (
      <>
        <Checkbox disabled={disabled} onChange={this.handleCheck} checked={checked}>
          {title}
        </Checkbox>
        {
          checked && (
            <div style={{marginTop: 16, maxWidth: 400}}>
              <Selector disabled={disabled} onChange={this.handleSelect} value={value} />
            </div>
          )
        }
      </>
    );
  }
}

function getWorkspaceId() {
  const prefix = window.APP_PREFIX + 'cms/';
  const path = window.location.pathname.substr(prefix.length);
  return path.split('/')[0];
}

type SelectorProps = {
  value: string,
  disabled: boolean;
  onChange: (value: string) => void
}

class Selector extends React.Component<SelectorProps> {
  constructor(props) {
    super(props);
    const workspaceId = getWorkspaceId();
    this.GET_SECRET = gql`
    {
      secrets(where: {ifDockerConfigJson: true, workspaceId: "${workspaceId}"}) {
        id
        name
        type
      }
    }
    `
  }

  render() {
    const {value, onChange, disabled} = this.props;
    return (
      <Query query={this.GET_SECRET}>
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
