import React from 'react';
import { Switch, Button, Modal } from 'antd';
import { Mutation } from 'react-apollo';
import { injectIntl } from 'react-intl';
import { get, isPlainObject } from 'lodash';
import uploadServerSecretModal from './UploadServerSecretModal';
import { RegenerateUploadServerSecretMutation } from 'queries/Volumes.graphql';

interface Props {
  intl?: any;
  name: string;
  allowRegenerateSecret: boolean;
  value?: boolean;
  onChange?: (boolean) => void;
}

interface State {
  checked: boolean;
}

@injectIntl
export default class EnableUploadServer extends React.Component<Props, State> {
  state = {
    checked: false,
  };

  componentDidMount() {
    const { value } = this.props;
    this.setState({
      checked: value,
    });
  }

  handleChange = checked => {
    const { onChange } = this.props;
    this.setState({
      checked,
    });
    onChange(checked);
  };

  render() {
    const { intl, name, allowRegenerateSecret, value } = this.props;
    const { checked } = this.state;

    return (
      <>
        <Switch
          onChange={value => {
            this.handleChange(value);
          }}
          checked={value}
        />
        <Mutation
          mutation={RegenerateUploadServerSecretMutation}
          variables={{
            where: {
              id: name,
            },
          }}
          onCompleted={data => {
            const secret = get(
              data,
              'regenerateUploadServerSecret.uploadServerSecret',
              null
            );
            if (isPlainObject(secret) && secret.username && secret.password) {
              uploadServerSecretModal({
                title: intl.formatMessage({
                  id: 'volume.regenerateSecretModalTitle',
                }),
                secret,
              });
            } else {
              Modal.error({
                title: intl.formatMessage({
                  id: 'volume.regenerateSecretErrorModalTitle',
                }),
                content: intl.formatMessage({
                  id: 'volume.regenerateSecretErrorModalContent',
                }),
                maskClosable: true,
              });
            }
          }}
          onError={() => {
            Modal.error({
              title: intl.formatMessage({
                id: 'volume.regenerateSecretErrorModalTitle',
              }),
              content: intl.formatMessage({
                id: 'volume.regenerateSecretErrorModalContent',
              }),
              maskClosable: true,
            });
          }}
        >
          {(mutate, { loading }) => (
            <Button
              disabled={!allowRegenerateSecret || !checked}
              onClick={mutate}
              loading={loading}
              style={{ marginLeft: 24 }}
            >
              Regenerate Secret
            </Button>
          )}
        </Mutation>
      </>
    );
  }
}
