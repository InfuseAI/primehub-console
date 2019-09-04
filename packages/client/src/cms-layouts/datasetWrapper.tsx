import * as React from 'react';
import {Item} from 'canner-helpers';
import {Button, Spin, Modal} from 'antd';
import styled from 'styled-components';
import {injectIntl} from 'react-intl';
import {isPlainObject, get} from 'lodash';
import uploadServerSecretModal from '../cms-components/uploadServerSecretModal';

const ButtonWrapper = styled.div`
  text-align: right;
`;

@injectIntl
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

      setTimeout(() => {
        this.setState({
          loading: false,
        }, () => {
          uploadServerSecretModal({
            title: intl.formatMessage({id: 'dataset.enableUploadServerModalTitle'}),
            secret,
            onOk: this.closeModal
          });
        });
      }, 400);
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
    const {goTo, routes} = this.props;
    goTo({pathname: routes[0]});
  }

  closeModal = () => {
    const {reset, refId} = this.props;
    this.setState({
      loading: false,
    }, () => {
      reset(refId.getPathArr()[0])
        .then(this.back);
    });
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
            {intl.formatMessage({id: 'hocs.route.resetText'})}
          </Button>
        </ButtonWrapper>
      </Spin>
    )
  }
}