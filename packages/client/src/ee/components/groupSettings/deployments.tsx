import * as React from 'react';
import {Form, Tabs, Row, Col, Switch, notification } from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get} from 'lodash';
import { RouteComponentProps } from 'react-router-dom';
import { GroupContextComponentProps } from 'context/group';
import { UserContextComponentProps } from 'context/user';
import GroupSettingsAlert from 'components/groupSettings/alert';

type Props = FormComponentProps & {
  currentUser: any;
} & GroupContextComponentProps & UserContextComponentProps & RouteComponentProps;

interface State {
  group: any;
}

class GroupSettingsDeployments extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      group: {},
    };
  }

  componentDidMount() {
    const { groupContext, currentUser } = this.props;
    const group = get(currentUser, 'me.groups', []).find(group => group.id === groupContext.id);
    this.setState({group});
  }

  componentDidUpdate(prevProps, prevState) {
    const { groupContext, currentUser, form } = this.props;
    const { group } = this.state;
    if (group.id !== groupContext.id) {
      const newGroup = get(currentUser, 'me.groups', []).find(group => group.id === groupContext.id);
      this.setState({group: newGroup});
    }
  }

  render() {
    const {groupContext, userContext, currentUser, history, form} = this.props;
    const {group} = this.state;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)) {
      history.push(`./home`);
    }

    return (
      <>
        <GroupSettingsAlert />
        <Form>
          <Row style={{marginTop: 5, marginLeft: 5, marginRight: 5}}>
            <Col>
              <Form.Item label={`Model Deployment`} style={{marginBottom: 20}}>
                {form.getFieldDecorator('enabledDeployment', {
                  initialValue: group.enabledDeployment,
                  valuePropName: 'checked',
                })(
                  <Switch disabled />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col>
              {this.renderInfoQuotaFormItem(
                'Maximum Deployment(s)',
                group.maxDeploy,
                { min: 0, step: 1, percision: 1 }
              )}
            </Col>
          </Row>
        </Form>
      </>
    );
  }
}


export default Form.create<Props>()(GroupSettingsDeployments);
