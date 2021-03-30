import * as React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import {Form, Tabs, Row, Col, Select, Input, InputNumber, notification } from 'antd';
import {FormComponentProps} from 'antd/lib/form';
import {compose} from 'recompose';
import {get, snakeCase, debounce} from 'lodash';
import InfuseButton from 'components/infuseButton';
import {errorHandler} from 'utils/errorHandler';
import ResourceMonitor from 'ee/components/shared/resourceMonitor';
import {PrePackagedServers} from 'ee/components/modelDeployment/prePackagedServers';
import { RouteComponentProps } from 'react-router-dom';
import { GroupContextComponentProps } from 'context/group';
import { UserContextComponentProps } from 'context/user';
import NumberWithSelectMultipler from 'cms-components/customize-number-with_select_multiplier'

type Props = FormComponentProps & {
  getGroups: any;
  updateGroup: any;
} & GroupContextComponentProps & UserContextComponentProps & RouteComponentProps;

interface State {
  group: any;
}

type FormValue = {
  groupId: string;
  activeDeadlineSeconds: number;
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

    let { groupContext, getGroups } = this.props;
    const group = get(getGroups, 'me.groups', []).find(group => group.id === groupContext.id);
    this.state = {
      group: group,
    };
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
      });
    });
  }

  render() {
    const {groupContext, userContext, getGroups, history, form} = this.props;
    if (userContext && !get(userContext, 'isCurrentGroupAdmin', false)) {
      history.push(`../home`);
    }

    const group = get(getGroups, 'me.groups', []).find(group => group.id === groupContext.id);

    return (
      <Form onSubmit={this.submit}>
        <Row style={{marginTop: 5, marginLeft: 10, marginRight: 10}}>
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
