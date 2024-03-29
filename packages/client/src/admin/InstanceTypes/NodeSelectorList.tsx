import * as React from 'react';
import { Button, Empty, Input, Icon, Form } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';

interface NodeSelectorListProps {
  nodes: string[][];
  form: WrappedFormUtils;
  onChange: React.Dispatch<React.SetStateAction<string[][]>>;
  style?: React.CSSProperties;
}

export function NodeSelectorList({
  nodes,
  form,
  ...props
}: NodeSelectorListProps) {
  const isEmpty = nodes.length === 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...props?.style,
      }}
    >
      {isEmpty ? (
        <Empty description='There are no fields.' />
      ) : (
        nodes.map((node, i) => (
          <NodeItemInputGroup
            key={i}
            id={i}
            node={node}
            form={form}
            onRemove={() => {
              const nextformNodeList = form
                .getFieldValue('nodeList')
                .filter((_, id) => id !== i);

              form.setFieldsValue({
                nodeList: nextformNodeList,
              });

              props.onChange(prev => prev.filter((_, id) => id !== i));
            }}
          />
        ))
      )}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          data-testid='add-field-button'
          type='dashed'
          onClick={() => {
            props.onChange(prev => [...prev, []]);
          }}
        >
          <Icon type='plus' /> Add field
        </Button>
      </div>
    </div>
  );
}

interface NodeItemInputGroupProps {
  /*
   * Represent each input group id.
   */
  id: number;

  /**
   * antd form helper
   */
  form: WrappedFormUtils;

  /* Each original NodeSelector format `{ xxx: yyy }`,
   * the node format handled by the upstream to `[xxx, yyy]`.
   */
  node: string[];

  /**
   * Execute onRemove.
   */
  onRemove: () => void;
}

export function NodeItemInputGroup({
  form,
  ...props
}: NodeItemInputGroupProps) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Form.Item
        label='Key'
        labelCol={{ sm: { span: 5 } }}
        style={{ display: 'flex', width: '25%' }}
        wrapperCol={{ style: { width: '100%' } }}
      >
        {form.getFieldDecorator(`nodeList[${props.id}][0]`, {
          validateTrigger: ['onChange', 'onBlur'],
          validateFirst: true,
          rules: [
            {
              required: true,
              message: 'Node Selector inputs fields can not be empty.',
            },
            {
              min: 3,
              max: 63,
              message: 'Must be between 3 and 63 characters',
            },
            {
              pattern: /^[A-Za-z0-9][_./-A-Za-z0-9]+[A-Za-z0-9]$/,
              message: `Must alphanumeric characters, '_', '.', '/' or '-', and start and end with an alphanumeric character.`,
            },
          ],
          initialValue: props.node[0],
        })(<Input />)}
      </Form.Item>

      <Form.Item
        label='Value'
        labelCol={{ sm: { span: 5 } }}
        style={{ display: 'flex', width: '25%' }}
        wrapperCol={{ style: { width: '100%' } }}
      >
        {form.getFieldDecorator(`nodeList[${props.id}][1]`, {
          validateTrigger: ['onChange', 'onBlur'],
          validateFirst: true,
          rules: [
            {
              required: true,
              message: 'Node Selector inputs fields can not be empty.',
            },
            {
              min: 3,
              max: 63,
              message: 'Must be between 3 and 63 characters',
            },
            {
              pattern: /^[A-Za-z0-9][_./-A-Za-z0-9]+[A-Za-z0-9]$/,
              message: `Must be alphanumeric characters, '_', '.', '/' or '-', and start and end with an alphanumeric character.`,
            },
          ],
          initialValue: props.node[1],
        })(<Input />)}
      </Form.Item>

      <Icon
        type='close-circle'
        theme='twoTone'
        style={{
          cursor: 'pointer',
          height: '16px',
          marginTop: '12px',
        }}
        onClick={() => {
          props.onRemove();
        }}
      />
    </div>
  );
}
