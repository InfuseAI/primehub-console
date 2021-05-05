import React from 'react';
import {Form, Modal, Select, Table} from 'antd';

export interface DeployDialogProps {
  modelVersion;
  deploymentRefs;
  onDeployNew?: (modelVersion: Object) => void;
  onDeployExisting?: (modelVersion: Object, deploymentRef: Object) => void;
  onCancel?: () => void;
};

export function DeployDialog(props: DeployDialogProps) {
  const {modelVersion, deploymentRefs, onDeployNew, onDeployExisting, onCancel} = props;

  return <Modal
          title={`Deploy Model`}
          visible={true}
          onCancel={onCancel ? () => onCancel() : undefined}
        >
          <Form><Form.Item label="Deployment" required={true}>
          <Select defaultValue="" style={{width: 400}} onChange={()=>{}}>

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
        </Modal>
}

