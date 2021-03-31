import * as React from 'react';
import {Form, Tabs, Row, Col, Switch, notification } from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {get} from 'lodash';
import { RouteComponentProps } from 'react-router-dom';
import { GroupContextComponentProps } from 'context/group';
import { UserContextComponentProps } from 'context/user';
import GroupSettingsAlert from 'components/groupSettings/alert';

type Props = FormComponentProps & {
  getGroups: any;
} & GroupContextComponentProps & UserContextComponentProps & RouteComponentProps;

interface State {
  group: any;
}

class GroupSettingsModels extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      group: {},
    };
  }

  componentDidMount() {
    const { groupContext, getGroups } = this.props;
    const group = get(getGroups, 'me.groups', []).find(group => group.id === groupContext.id);
    this.setState({group});
  }

  componentDidUpdate(prevProps, prevState) {
    const { groupContext, getGroups, form } = this.props;
    const { group } = this.state;
    if (group.id !== groupContext.id) {
      const newGroup = get(getGroups, 'me.groups', []).find(group => group.id === groupContext.id);
      this.setState({group: newGroup});
    }
  }

  render() {
    const {groupContext, userContext, getGroups, history, form} = this.props;
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
        </Form>
      </>
    );
  }
}


export default Form.create<Props>()(GroupSettingsModels);
