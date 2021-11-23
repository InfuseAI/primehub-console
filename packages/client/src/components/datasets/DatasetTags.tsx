import * as React from 'react';
import { Tag, Tooltip, Icon, Input } from 'antd';

interface DatasetTagsProps {
  value?: string[];
  onChange?: (value) => void;
}

export default function DatasetTags({
  value = [],
  onChange,
}: DatasetTagsProps) {
  const [tags, setTags] = React.useState(value);
  const [inputVisible, setInputVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputVisible) {
      inputRef.current?.input.focus();
    }
  }, [inputVisible]);

  function handleClose(removedTag) {
    const newTags = tags.filter(t => t !== removedTag);
    setTags(newTags);
    onChange(newTags);
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
      const newTags = [...tags, inputValue];
      setTags(newTags);
      onChange(newTags);
    }
  }

  return (
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
  );
}
