import * as React from 'react';
import {Item} from 'canner-helpers';
import {Button, Spin, Modal} from 'antd';
import styled from 'styled-components';
import {injectIntl} from 'react-intl';
import {isPlainObject, get} from 'lodash';
import {withApollo} from 'react-apollo';
import gql from 'graphql-tag';
import uploadServerSecretModal from '../cms-components/uploadServerSecretModal';

const ButtonWrapper = styled.div`
  text-align: right;
`;

@injectIntl
@withApollo
export default class DatasetWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadingTip: ''
    };
  }

  deploy = () => {
    const {refId, deploy, intl} = this.props;
    this.setState({
      loading: true,
      loadingTip: intl.formatMessage({id: 'hocs.route.deployingTip'}),
    });
    deploy(refId.getPathArr()[0])
      .then(this.handleSecretModal)
      .catch(this.fail);
  }

  reset = () => {
    const {refId, reset, intl} = this.props;
    this.setState({
      loading: true,
      loadingTip: intl.formatMessage({id: 'hocs.route.resetingTip'}),
    });
    reset(refId.getPathArr()[0])
      .then(this.success)
      .catch(this.fail);
  }

  handleSecretModal = (updateValue) => {
    const {intl} = this.props;
    const secret = get(updateValue, 'updateDataset.uploadServerSecret');
    if (isPlainObject(secret) && secret.username && secret.password) {
      this.setState({
        loading: false,
      }, () => {
        uploadServerSecretModal({
          title: intl.formatMessage({id: 'dataset.enableUploadServerModalTitle'}),
          secret,
          onOk: this.closeModal
        });
      });
    } else {
      this.success();
    }
  }

  success = () => {
    setTimeout(() => {
      this.setState({
        loading: false
      }, this.back);
    }, 400);
  }

  fail = () => {
    this.setState({
      loading: false
    });
  }

  back = () => {
    const {goTo, routes, client, schema, query} = this.props;
    // refresh server link
    client.query({
      fetchPolicy: 'network-only',
      query: gql`${schema.dataset.graphql}`,
      variables: {
        after: query.variables.$datasetAfter,
        before: query.variables.$datasetBefore,
        first: query.variables.$datasetFirst,
        last: query.variables.$datasetLast,
        orderBy: query.variables.$datasetOrderBy,
        where: {...(query.variables.$datasetWhere || {}), id: undefined}
      }
    }).then(() => {
      goTo({pathname: routes[0]});
    });
  }

  closeModal = () => {
    const {reset, refId} = this.props;
    this.setState({
      loading: false,
    }, this.back);
  }

  render() {
    const {intl} = this.props;
    const {loading, loadingTip} = this.state;
    return (
      <Spin tip={loadingTip} spinning={loading}>
        <Item />
        <ButtonWrapper>
          <Button style={{marginRight: 16}} type="primary" onClick={this.deploy} data-testid="confirm-button">
            {intl.formatMessage({id: 'hocs.route.confirmText'})}
          </Button>
          <Button onClick={this.reset} data-testid="reset-button">
            {intl.formatMessage({id: 'deploy.confirm.cancel'})}
          </Button>
        </ButtonWrapper>
      </Spin>
    )
  }
}