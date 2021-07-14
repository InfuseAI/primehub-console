import * as React from 'react';
import { Form, Modal, Select } from 'antd';

import { ModelVersion, Deployment } from './types';
interface Props {
  visible: boolean;
  modelVersion;
  deploymentRefs: Deployment[];
  onDeployNew?: (modelVersion: ModelVersion) => void;
  onDeployExisting?: (
    modelVersion: ModelVersion,
    deploymentRef: Deployment
  ) => void;
  onCancel?: () => void;
}

export function DeployDialog({ visible = false, ...props }: Props) {
  const [value, setValue] = React.useState('');

  function handleOK() {
    const { modelVersion, deploymentRefs } = props;

    if (value === '') {
      if (props?.onDeployNew) {
        props.onDeployNew(modelVersion);
      }
    } else {
      if (props?.onDeployExisting) {
        const deploymentRef = deploymentRefs.find(
          (deploy) => deploy.id === value
        );
        props.onDeployExisting(modelVersion, deploymentRef);
      }
    }
  }

  function handleCancel() {
    if (props?.onCancel) {
      props.onCancel();
    }
  }

  return (
    <Modal
      title="Deploy Model"
      visible={visible}
      onOk={handleOK}
      onCancel={handleCancel}
    >
      <Form>
        <Form.Item label="Deployment" required={true}>
          <Select
            defaultValue="create-new-deployment"
            style={{ width: 400 }}
            onChange={(v: string) => {
              setValue(v);
            }}
          >
            <Select.Option value="create-new-deployment">
              + Create new deployment
            </Select.Option>

            {props.deploymentRefs.length && (
              <Select.OptGroup label="Update existing deployments">
                {props.deploymentRefs.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            )}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
