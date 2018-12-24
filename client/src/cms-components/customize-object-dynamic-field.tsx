import React from 'react';
import {Input, Icon, Button} from 'antd';
import get from 'lodash/get';
import {Props} from './types';
const InputGroup = Input.Group;

type State = {
  fields: Array<any>
}

export default class DynamicFields extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const {value, onDeploy, refId, onChange} = props;
    this.state = {
      fields: objectToArray(value || {})
    };
  }

  add = () => {
    const {onChange, refId} = this.props;
    this.setState({
      fields: this.state.fields.concat({key: '', value: ''})
    }, () => {
      onChange(refId, 'update', {...arrayToObject(this.state.fields)});
    });
  }

  remove = index => {
    const {fields} = this.state;
    const {onChange, refId} = this.props;
    fields.splice(index, 1)
    this.setState({
      fields
    }, () => {
      onChange(refId, 'update', {...arrayToObject(this.state.fields)});
    });
  }

  changeValue = (newValue, index) => {
    const {fields} = this.state;
    const {onChange, refId} = this.props;
    fields[index].value = newValue;
    this.setState({
      fields
    }, () => {
      onChange(refId, 'update', {...arrayToObject(this.state.fields)});
    });
  }

  changeKey = (key, index) => {
    const {fields} = this.state;
    const {onChange, refId} = this.props;
    fields[index].key = key;
    this.setState({
      fields
    }, () => {
      onChange(refId, 'update', {...arrayToObject(this.state.fields)});
    });
  }

  render() {
    const {fields} = this.state;
    const {rootValue, refId, uiParams, title} = this.props;
    const recordValue = getRecordValue(rootValue, refId);
    // hack
    const isHidden = uiParams.isHidden ? uiParams.isHidden(recordValue) : false;
    if (isHidden) {
      return null;
    }
    return (
      <React.Fragment>
        {
          uiParams.isHidden && <div style={{marginTop: 16, fontSize: 18}}>{title}</div>
        }
        {
          fields.map((field, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
              <div style={{marginRight: 16}}>{i + 1}.</div>
              <InputGroup compact style={{width: '50%', marginRight: 16}}>
                <Input data-testid={`key-input-${i}`} placeholder="key" style={{ width: '40%'}} value={field.key} onChange={e => this.changeKey(e.target.value, i)}/>
                <Input data-testid={`value-input-${i}`} placeholder="value" style={{ width: '60%'}} value={field.value} onChange={e => this.changeValue(e.target.value, i)}/>
              </InputGroup>
              <a href="javascript:;" onClick={() => this.remove(i)}>
                <Icon type="close-circle-o"/>
              </a>
            </div>
          ))
        }
        <Button type="dashed" data-testid="add-field-button" onClick={this.add} style={{ width: 'calc(50% + 16px)', marginTop: 16 }}>
          <Icon type="plus" /> Add field
        </Button>
      </React.Fragment>
    )
  }
}

function objectToArray(obj) {
  return Object.keys(obj).reduce((result, key) => {
    if (key === '__typename') {
      return result;
    }
    result.push({
      key,
      value: obj[key]
    });
    return result;
  }, []);
}

function arrayToObject(arr) {
  return arr.reduce((result, item) => {
    if (item.key === '__typename') {
      return result;
    } 
    result[item.key] = item.value;
    return result;
  }, {});
}

function getRecordValue(rootValue, refId) {
  const targetRefId = refId.remove();
  return get(rootValue, targetRefId.getPathArr());
}