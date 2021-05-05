import React from 'react';
import {Form, Modal, Select, Table} from 'antd';

interface Props {
  modelVersion;
  deploymentRefs;
  onDeployNew?: (modelVersion: Object) => void;
  onDeployExisting?: (modelVersion: Object, deploymentRef: Object) => void;
  onCancel?: () => void;
};

interface State {
  value: string;
}

export class DeployDialog extends React.Component<Props, State> {
  state = {
    value: "",
  }

  private handleChange = (value) => {
    this.setState({value});
  };

  private handleOk = () => {
    const {modelVersion, deploymentRefs, onDeployNew, onDeployExisting} = this.props;
    const {value} = this.state;

    if (value === "") {
      if (onDeployNew) {
        onDeployNew(modelVersion);
      }
    } else {
      if (onDeployExisting) {
        const deploymentRef = deploymentRefs.find(deploy => deploy.id === value);
        onDeployExisting(modelVersion, deploymentRef);
      }
    }
  }

  private handleCancel = () => {
    const {onCancel} = this.props;
    if (onCancel) {
      onCancel();
    }
  }

  render () {
    const {
      deploymentRefs,
      onCancel
    } = this.props;

    const {
      value,
    } = this.state;


    return <Modal
            title={`Deploy Model`}
            visible={true}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <Form><Form.Item label="Deployment" required={true}>
            <Select defaultValue={value} style={{width: 400}} onChange={this.handleChange}>

              <Select.Option value="">+ Create new deployment</Select.Option>
              {
                deploymentRefs.length > 0 ?

                <Select.OptGroup label="Update existing deployments">
                  {
                    deploymentRefs.map((item)=> <Select.Option value={item.id}>{item.name}</Select.Option>)
                  }
                </Select.OptGroup>: <></>
              }
            </Select>
            </Form.Item></Form>
          </Modal>;
  }
}

