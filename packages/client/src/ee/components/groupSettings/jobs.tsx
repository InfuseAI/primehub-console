import * as React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import {Form, Tabs, Row, Col, Select, Input, InputNumber, notification } from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {compose} from 'recompose';
import {get} from 'lodash';
import InfuseButton from 'components/infuseButton';
import {errorHandler} from 'utils/errorHandler';
import { RouteComponentProps } from 'react-router-dom';
import { GroupContextComponentProps } from 'context/group';
import { UserContextComponentProps } from 'context/user';
import NumberWithSelectMultipler from 'cms-components/customize-number-with_select_multiplier'

type Props = FormComponentProps & {
  currentUser: any;
  updateGroup: any;
} & GroupContextComponentProps & UserContextComponentProps & RouteComponentProps;

interface State {
  group: any;
}

type FormValue = {
  groupId: string;
  jobDefaultActiveDeadlineSeconds: number;
};

const UPDATE_GROUP = gql`
  mutation ($where: GroupWhereUniqueInput!, $data: GroupUpdateInput! ) {
    updateGroup (where: $where, data: $data) { id name }
  }
`;

const options = [
  {
    text: 'Minutes',
    value: 'm',
    multiplier: 60
  }, {
    text: 'Hours',
    value: 'h',
    multiplier: 60*60
  }, {
    text: 'Days',
    value: 'd',
    multiplier: 60*60*24
  }
];

class GroupSettingsJobs extends React.Component<Props, State> {
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
        group.jobDefaultActiveDeadlineSeconds = values.jobDefaultActiveDeadlineSeconds;
        form.setFieldsValue({jobDefaultActiveDeadlineSeconds: values.jobDefaultActiveDeadlineSeconds});
      });
    });
  }

  render() {
    const {groupContext, userContext, currentUser, history, form} = this.props;
    const {group} = this.state;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)) {
      history.push(`./home`);
    }

    return (
      <Form onSubmit={this.submit}>
        <Row style={{marginLeft: 5, marginRight: 5}}>
          <Col>
            <Form.Item label={`Default Timeout Setting`} style={{marginBottom: 20}}>
              {form.getFieldDecorator('jobDefaultActiveDeadlineSeconds', {
                initialValue: group.jobDefaultActiveDeadlineSeconds,
              })(
                <NumberWithSelectMultipler
                  uiParams={{
                    options: options,
                    styleOnSelect: {width: 200},
                    defaultSelected: 1,
                    styleOnInput: {width: 100, marginRight: 10},
                    min: 0,
                    max: 999,
                    step: 1,
                  }}
                />
              )}
            </Form.Item>
            <Form.Item style={{textAlign: 'right', marginTop: 20, marginBottom: 5}}>
              <InfuseButton type='primary' htmlType='submit'>Save</InfuseButton>
            </Form.Item>
          </Col>
        </Row>
      </Form>
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
)(GroupSettingsJobs);
