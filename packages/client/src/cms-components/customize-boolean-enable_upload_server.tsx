import React from 'react';
import {Switch, Button, Modal} from 'antd';
import {Props} from './types';
import {Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import {injectIntl} from 'react-intl';
import {get, isPlainObject} from 'lodash';
import uploadServerSecretModal from './uploadServerSecretModal';

const REGENERATE_UPLOAD_SERVER_SECRET = gql`
  mutation RegenerateUploadServerSecret($where: DatasetWhereUniqueInput!) {
    regenerateUploadServerSecret(where: $where) {
      id
      uploadServerSecret {
        username
        password
      }
    }
  }
`;

@injectIntl
export default class EnableUploadServer extends React.Component<Props> {
  state = {
    initialValue: false
  };

  componentDidMount() {
    const {value} = this.props;
    this.setState({
      initialValue: value
    });
  }

  onChange = (checked) => {
    const {onChange, refId} = this.props;
    onChange(refId, 'update', checked);
  }

  render() {
    const {value, routerParams, refId, intl, rootValue} = this.props;
    const {initialValue} = this.state;
    const pathArr = refId.getPathArr();
    const disabled = routerParams.op === 'create' || !initialValue || !value;
    return (
      <React.Fragment>
        <Switch onChange={this.onChange} checked={value} disabled={(window as any).disableEnableSharedVolume} />
        <Mutation
          mutation={REGENERATE_UPLOAD_SERVER_SECRET}
          variables={{
            where: {
              id: get(rootValue, [pathArr[0], pathArr[1], 'id'])
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
          {(mutate, {loading}) => {
            return (
              <Button
                onClick={mutate}
                loading={loading}
                style={{marginLeft: 24}}
                disabled={disabled}
              >
                Regenerate Secret
              </Button> 
            );
          }}
        </Mutation>
      </React.Fragment>
    );
  }
}
