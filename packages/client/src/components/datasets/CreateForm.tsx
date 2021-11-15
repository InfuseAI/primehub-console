import * as React from 'react';
import { Tag, Tooltip, Icon, Button, Input, Modal } from 'antd';
import { Dataset } from './common';

interface Props {
  dataset?: Pick<Dataset, 'id' | 'name' | 'tags'>;
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; name: string; tags: string[] }) => void;
}

function genId(value: string) {
  if (value === '') {
    return '';
  }
  const normalizedName = value.trim().replace(/[\W_]/g, '-').toLowerCase();
  const randomString = Math.random().toString(36).substring(6).substring(0, 5);
  return `${normalizedName}-${randomString}`;
}

export function DatasetCreateForm({
  dataset,
  visible,
  onClose,
  onSubmit,
}: Props) {
  const [id, setId] = React.useState('');
  const [name, setName] = React.useState('');
  const [tags, setTags] = React.useState([]);
  const [inputVisible, setInputVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (dataset?.id) {
      setId(dataset.id);
      setName(dataset.name);
      setTags(dataset.tags);
    }
  }, [dataset]);

  React.useEffect(() => {
    if (inputVisible) {
      inputRef.current?.input.focus();
    }
  }, [inputVisible]);

  function handleClose(removedTag) {
    setTags(prevTags => prevTags.filter(t => t !== removedTag));
  }

  function showInput() {
    setInputVisible(true);
  }

  function handleInputChange(e) {
    setInputValue(e.target.value);
  }

  function handleInputConfirm() {
    setInputVisible(false);
    setInputValue('');
    if (inputValue && tags.indexOf(inputValue) === -1) {
      setTags(prevTags => [...prevTags, inputValue]);
    }
  }

  return (
    <Modal
      title={`${dataset?.id ? 'Edit' : 'New'} Dataset`}
      maskClosable={false}
      width={580}
      visible={visible}
      footer={[
        <div
          key='create-form-footer'
          style={{
            display: 'flex',
            padding: '2px 8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flex: 1,
              margin: 'auto',
              color: '#a4a4a4',
              textAlign: 'left',
            }}
          >
            Dataset ID: {id}
          </div>
          <Button type='default' onClick={onClose}>
            Cancel
          </Button>
          <Button
            type='primary'
            disabled={id.length === 0 || name.length === 0}
            onClick={async () => {
              await onSubmit({ id, name, tags });
              if (!dataset) {
                setId('');
                setName('');
                setTags([]);
              }
              onClose();
            }}
          >
            {dataset?.id ? 'Update Information' : 'Create Dataset'}
          </Button>
        </div>,
      ]}
      onCancel={onClose}
    >
      <div
        style={{
          fontWeight: 500,
          padding: '8px 0',
        }}
      >
        Dataset Name
      </div>
      <Input
        placeholder={'Enter Dataset Name'}
        value={name}
        onChange={e => {
          if (!dataset) {
            setId(genId(e.target.value));
          }
          setName(e.target.value);
        }}
      />
      <div
        style={{
          fontWeight: 500,
          padding: '8px 0',
        }}
      >
        Tags
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {tags.map(tag => {
          const isLongTag = tag.length > 20;
          const tagElem = (
            <Tag key={tag} closable={true} onClose={() => handleClose(tag)}>
              {isLongTag ? `${tag.slice(0, 20)}...` : tag}
            </Tag>
          );
          return isLongTag ? (
            <Tooltip title={tag} key={tag}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}
        <Input
          ref={inputRef}
          type='text'
          size='small'
          style={{
            display: inputVisible ? 'inline-block' : 'none',
            width: 78,
            height: 20,
          }}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onPressEnter={handleInputConfirm}
        />
        <Tag
          onClick={showInput}
          style={{
            display: inputVisible ? 'none' : 'inline-block',
            background: '#fff',
            borderStyle: 'dashed',
          }}
        >
          <Icon type='plus' /> New Tag
        </Tag>
      </div>
    </Modal>
  );
}
