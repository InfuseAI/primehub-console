import React from 'react';
import { Switch, Button, Modal } from 'antd';
import { Mutation } from 'react-apollo';
import { injectIntl } from 'react-intl';
import { get, isPlainObject } from 'lodash';
import uploadServerSecretModal from './uploadServerSecretModal';
import { RegenerateUploadServerSecretMutation } from './datasets.graphql';

interface Props {
  intl: any;
  name: string;
  allowRegenerateSecret: boolean;
  value: boolean;
  onChange;
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

  handleChange = (checked) => {
    const { onChange } = this.props;
    this.setState({
      checked,
    });
    onChange(checked);
  }

  render() {
    const { intl, name, allowRegenerateSecret, value } = this.props;
    const { checked } = this.state;

    return (
      <>
        <Switch onChange={(value) => {
          this.handleChange(value);
        }} checked={value} />
        {allowRegenerateSecret && (
          <Mutation
            mutation={RegenerateUploadServerSecretMutation}
            variables={{
              where: {
                id: name,
              }
            }}
            onCompleted={data => {
              const secret = get(data, 'regenerateUploadServerSecret.uploadServerSecret', null);
              if (isPlainObject(secret) && secret.username && secret.password) {
                uploadServerSecretModal({
                  title: intl.formatMessage({id: 'dataset.regenerateSecretModalTitle'}),
                  secret,
                  onOk: () => {}
                });
              } else {
                Modal.error({
                  title: intl.formatMessage({id: 'dataset.regenerateSecretErrorModalTitle'}),
                  content: intl.formatMessage({id: 'dataset.regenerateSecretErrorModalContent'})
                });
              }
            }}
            onError={() => {
              Modal.error({
                title: intl.formatMessage({id: 'dataset.regenerateSecretErrorModalTitle'}),
                content: intl.formatMessage({id: 'dataset.regenerateSecretErrorModalContent'})
              });
            }}
          >
            {(mutate, { loading }) => (
              <Button
                onClick={mutate}
                loading={loading}
                style={{ marginLeft: 24 }}
                disabled={!checked}
              >
                Regenerate Secret
              </Button>
            )}
          </Mutation>
        )}
      </>
    );
  }
}
