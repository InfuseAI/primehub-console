import * as React from 'react';
import { Form, Row, Col, Switch, Checkbox, Input, InputNumber } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { get, isNull } from 'lodash';
import { RouteComponentProps } from 'react-router-dom';
import { GroupContextComponentProps } from 'context/group';
import { UserContextComponentProps } from 'context/user';
import GroupSettingsAlert from 'components/groupSettings/alert';
import Feature, { FeatureEE } from 'components/share/feature';

type Props = FormComponentProps & {
  currentUser: any;
} & GroupContextComponentProps &
  UserContextComponentProps &
  RouteComponentProps;

interface State {
  group: any;
}

const inputNumberStyle = {
  width: 193,
};

const checkboxStyle = {
  marginRight: 8,
};

class GroupSettingsDeployments extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      group: {},
    };
  }

  componentDidMount() {
    const { groupContext, currentUser } = this.props;
    const group = get(currentUser, 'me.groups', []).find(
      group => group.id === groupContext.id
    );
    this.setState({ group });
  }

  componentDidUpdate(prevProps, prevState) {
    const { groupContext, currentUser, form } = this.props;
    const { group } = this.state;
    if (group.id !== groupContext.id) {
      const newGroup = get(currentUser, 'me.groups', []).find(
        group => group.id === groupContext.id
      );
      this.setState({ group: newGroup });
    }
  }

  renderInfoQuotaFormItem(title, value, params) {
    return (
      <Form.Item label={title}>
        <div style={{ alignItems: 'center' }}>
          <Checkbox style={checkboxStyle} checked={!isNull(value)} disabled />
          {isNull(value) ? (
            <Input style={inputNumberStyle} value={'unlimited'} disabled />
          ) : (
            <InputNumber
              style={inputNumberStyle}
              min={params && params.min}
              step={params && params.step}
              precision={params && params.precision}
              formatter={(value) =>
                `${value}${params && params.unit ? params.unit : ''}`
              }
              value={value}
              disabled
            />
          )}
        </div>
      </Form.Item>
    );
  }

  render() {
    const { groupContext, userContext, currentUser, history, form } =
      this.props;
    const { group } = this.state;
    return (
      <>
        <GroupSettingsAlert groupId={group.id}/>
        <Form>
          <FeatureEE>
            <Row style={{ marginTop: 5, marginLeft: 5, marginRight: 5 }}>
              <Col>
                <Form.Item
                  label={`Model Deployment`}
                  style={{ marginBottom: 20 }}
                >
                  {form.getFieldDecorator('enabledDeployment', {
                    initialValue: group.enabledDeployment,
                    valuePropName: 'checked',
                  })(<Switch disabled />)}
                </Form.Item>
              </Col>
            </Row>
          </FeatureEE>
          <Feature ce={false}>
            <Row>
              <Col>
                {this.renderInfoQuotaFormItem(
                  'Maximum Deployment(s)',
                  group.maxDeploy,
                  { min: 0, step: 1, percision: 1 }
                )}
              </Col>
            </Row>
          </Feature>
        </Form>
      </>
    );
  }
}

export default Form.create<Props>()(GroupSettingsDeployments);
