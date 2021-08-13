import * as React from 'react';
import { Button, Empty, Input, Icon, Form } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';

interface NodeSelectorListProps {
  nodes: string[][];
  form: WrappedFormUtils;
  onChange?: React.Dispatch<React.SetStateAction<string[][]>>;
  style?: React.CSSProperties;
}

export function NodeSelectorList({ nodes, ...props }: NodeSelectorListProps) {
  const isEmpty = nodes.length === 0;
  const removeable = nodes.length > 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        ...props?.style,
      }}
    >
      {isEmpty ? (
        <Empty description="There are no fields." />
      ) : (
        nodes.map((node, i) => (
          <NodeItemInput
            key={i}
            id={i}
            node={node}
            form={props.form}
            removeable={removeable}
            onRemove={() => {
              // Tricky way to remove...
              props.form.resetFields();

              props.onChange((prev) => {
                const nextNodes = prev.filter((node, id) => {
                  return id !== i;
                });

                return nextNodes;
              });
            }}
          />
        ))
      )}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {/* @ts-ignore */}
        <Button
          type="dashed"
          onClick={() => {
            props.onChange((prev) => [...prev, []]);
          }}
        >
          <Icon type="plus" /> Add field
        </Button>
      </div>
    </div>
  );
}

interface NodeItemInputProps {
  /**
   * antd form helper
   */
  form: any;

  /*
   * Represent each input group id.
   */
  id: number;

  /*
   * Rendering remove icon.
   */
  removeable?: boolean;

  /* Each original NodeSelector format `{ xxx: yyy }`,
   * the node format handled by the upstream to `[xxx, yyy]`.
   */
  node: string[];

  /**
   * Execute onRemove logic.
   */
  onRemove: () => void;
}

export function NodeItemInput({ removeable, ...props }: NodeItemInputProps) {
  return (
    <div style={{ display: 'flex', gap: '36px' }}>
      <Form.Item
        label="Key"
        labelCol={{
          sm: { span: 3 },
        }}
        style={{ display: 'flex', width: '42%' }}
      >
        {props.form.getFieldDecorator(`nodeList[${props.id}][0]`, {
          validateTrigger: ['onBlur'],
          rules: [
            {
              required: true,
              validator: (_, value, callabck) => {
                if (value.length < 3 || value.length > 63) {
                  return callabck('🔸 Must be between 3 and 63 characters');
                }

                if (!value.match(/^[A-Za-z0-9][_./-A-Za-z0-9]+[A-Za-z0-9]$/)) {
                  return callabck(`🔸 Must be alphanumeric characters, '_', '.', '/' or
                            '-', and start and end with an alphanumeric
                            character.`);
                }
              },
            },
          ],
          initialValue: props.node[0],
        })(<Input style={{ width: '415px' }} />)}
      </Form.Item>

      <Form.Item
        label="Value"
        labelCol={{
          sm: { span: 3 },
        }}
        style={{ display: 'flex', width: '42%' }}
      >
        {props.form.getFieldDecorator(`nodeList[${props.id}][1]`, {
          validateTrigger: ['onBlur'],
          rules: [
            {
              required: true,
              validator: (_, value, callabck) => {
                if (value.length < 3 || value.length > 63) {
                  return callabck('Must be between 3 and 63 characters');
                }

                if (!value.match(/^[A-Za-z0-9][_./-A-Za-z0-9]+[A-Za-z0-9]$/)) {
                  return callabck(`Must be alphanumeric characters, '_', '.', '/' or
                            '-', and start and end with an alphanumeric
                            character.`);
                }
              },
            },
          ],
          initialValue: props.node[1],
        })(<Input style={{ width: '415px' }} />)}
      </Form.Item>

      {removeable && (
        <Icon
          type="close-circle"
          theme="twoTone"
          style={{
            cursor: 'pointer',
            height: '16px',
            marginTop: '12px',
          }}
          onClick={() => {
            props.onRemove();
          }}
        />
      )}
    </div>
  );
}
