import React from 'react';
import {Input, Icon, Button} from 'antd';
import {Item} from 'canner-helpers';
import item from '../../node_modules/canner-helpers/lib/item';
const InputGroup = Input.Group;

export default class DynamicFields extends React.Component {
  constructor(props) {
    super(props);
    const {value, onDeploy, refId, onChange} = props;
    this.state = {
      fields: objectToArray(value || {})
    };
    onDeploy(data => {
      return {...arrayToObject(this.state.fields)};
    });
  }

  componentWillReceiveProps(nextProps) {
    const value = nextProps.value || {};
    this.setState({
      fields: objectToArray(nextProps.value || {})
    });
  }

  add = () => {
    const {onChange, refId} = this.props;
    this.setState({
      fields: this.state.fields.concat({key: '', value: ''})
    });
    onChange(refId, 'update', {...arrayToObject(this.state.fields), '': ''});
  }

  changeValue = (value, index) => {
    const {fields} = this.state;
    fields[index].value = value;
    this.setState({
      fields
    });
  }

  changeKey = (key, index) => {
    const {fields} = this.state;
    fields[index].key = key;
    this.setState({
      fields
    });
  }

  render() {
    const {fields} = this.state;
    return (
      <React.Fragment>
        {
          fields.map((field, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center'}}>
              <div style={{marginRight: 16}}>{i + 1}.</div>
              <InputGroup compact>
                <Input placeholder="key" style={{ width: '20%'}} value={field.key} onChange={e => this.changeKey(e.target.value, i)}/>
                <Input placeholder="value" style={{ width: '30%'}} value={field.value} onChange={e => this.changeValue(e.target.value, i)}/>
              </InputGroup>
            </div>
          ))
        }
        <Button type="dashed" onClick={this.add} style={{ width: '400px', marginTop: 16 }}>
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