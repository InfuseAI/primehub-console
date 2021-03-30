import * as React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import {Form, Tabs, Row, Col, Switch, notification } from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {compose} from 'recompose';
import {get} from 'lodash';
import InfuseButton from 'components/infuseButton';
import {errorHandler} from 'utils/errorHandler';
import { RouteComponentProps } from 'react-router-dom';
import { GroupContextComponentProps } from 'context/group';
import { UserContextComponentProps } from 'context/user';
import { renderAlert } from 'containers/GroupSettingsPage';

type Props = FormComponentProps & {
  getGroups: any;
  updateGroup: any;
} & GroupContextComponentProps & UserContextComponentProps & RouteComponentProps;

interface State {
  group: any;
}

type FormValue = {
  groupId: string;
  enabledDeployment: boolean;
};

const UPDATE_GROUP = gql`
  mutation ($where: GroupWhereUniqueInput!, $data: GroupUpdateInput! ) {
    updateGroup (where: $where, data: $data) { id name }
  }
`;

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
      form.resetFields();
      this.setState({group: newGroup});
    }
  }

  submit = (e) => {
    const {form, updateGroup} = this.props;
    const {group} = this.state;
    e.preventDefault();
    form.validateFields(async (err, values: FormValue) => {
      if (err) return;
      updateGroup({
        variables: {
          where: {id: group.id},
          data: values,
        }
      }).then(() => {
        group.enabledDeployment = values.enabledDeployment;
        form.setFieldsValue({enabledDeployment: values.enabledDeployment});
      });
    });
  }

  render() {
    const {groupContext, userContext, getGroups, history, form} = this.props;
    const {group} = this.state;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)) {
      history.push(`./home`);
    }

    return (
      <>
        {renderAlert()}
        <Form onSubmit={this.submit}>
          <Row style={{marginTop: 5, marginLeft: 5, marginRight: 5}}>
            <Col>
              <Form.Item label={`Model Deployment`} style={{marginBottom: 20}}>
                {form.getFieldDecorator('enabledDeployment', {
                  initialValue: group.enabledDeployment,
                  valuePropName: 'checked',
                })(
                  <Switch />
                )}
              </Form.Item>
              <Form.Item style={{textAlign: 'right', marginTop: 20, marginBottom: 5}}>
                <InfuseButton type='primary' htmlType='submit'>Save</InfuseButton>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </>
    );
  }
}


export default compose(
  graphql(UPDATE_GROUP, {
    options: (props: Props) => ({
      onCompleted: (data: any) => {
        notification.success({
          duration: 10,
          placement: 'bottomRight',
          message: 'Success!',
          description: (
            <>
              Group '{data.updateGroup.name}' updated.
            </>
          )
        });
      },
      onError: errorHandler
    }),
    name: 'updateGroup'
  }),
  Form.create<Props>(),
)(GroupSettingsModels);
