import React from 'react';
import {Input, Icon, Button} from 'antd';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import {Empty} from '../empty';

const InputGroup = Input.Group;

type Props = {
  onChange?: (value: object) => void;
  disabled?: boolean;
  value?: object;
}

type State = {
  fields: Array<any>,
  errorIndex?: number,
  errorMessage?: string,
}

export default class DynamicFields extends React.Component<Props, State> {
  private callbackId: string;

  constructor(props) {
    super(props);
    const {value, onDeploy, refId, onChange} = props;
    this.state = {
      fields: objectToArray(value || {})
    };
    this.callbackId = null;
  }
  add = () => {
    const {onChange} = this.props;
    this.setState({
      fields: this.state.fields.concat({key: '', value: ''}),
      errorIndex: -1,
    }, () => {
      onChange(arrayToObject(this.state.fields));
    });
  }

  remove = index => {
    const {fields} = this.state;
    const {onChange} = this.props;
    fields.splice(index, 1)
    this.setState({
      fields,
      errorIndex: -1,
    }, () => {
      onChange(arrayToObject(this.state.fields));
    });
  }

  changeValue = (newValue, index) => {
    const {fields} = this.state;
    const {onChange} = this.props;
    fields[index].value = newValue;
    this.setState({
      fields,
      errorIndex: -1
    }, () => {
      onChange(arrayToObject(this.state.fields));
    });
  }

  changeKey = (key, index) => {
    const {fields} = this.state;
    const {onChange} = this.props;
    fields[index].key = key;
    this.setState({
      fields,
      errorIndex: -1
    }, () => {
      onChange(arrayToObject(this.state.fields));
    });
  }

  render() {
    const {fields, errorIndex, errorMessage} = this.state;
    const {disabled} = this.props;

    return (
      <React.Fragment>
        {
          fields.length === 0 ? (
            <Empty
              style={{ width: 'calc(50% + 16px)'}}
              height={200}
              description="Empty."
            />
          ) :fields.map((field, i) => (
            <React.Fragment key={i}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
                <div style={{marginRight: 16}}>{i + 1}.</div>
                <InputGroup compact style={{width: '50%', marginRight: 16}}>
                  <Input disabled={disabled} data-testid={`key-input-${i}`} placeholder="key" style={{ width: '40%'}} value={field.key} onChange={e => this.changeKey(e.target.value, i)}/>
                  <Input disabled={disabled} data-testid={`value-input-${i}`} placeholder="value" style={{ width: '60%'}} value={field.value} onChange={e => this.changeValue(e.target.value, i)}/>
                </InputGroup>
                {
                  disabled ? null :(
                    <a href="javascript:;" onClick={() => this.remove(i)}>
                      <Icon type="close-circle-o"/>
                    </a>
                  )
                }
              </div>
              {
                errorIndex === i && (
                  <p style={{color: 'red'}}>
                    {errorMessage}
                  </p>
                )
              }
            </React.Fragment>
          ))
        }
        {
          disabled === true ? (
            null
          ) : (
            <Button type="dashed" data-testid="add-field-button" onClick={this.add} style={{ width: 'calc(50% + 16px)', marginTop: 16 }}>
              <Icon type="plus" /> Add field
            </Button>
          )
        }
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
  const result = arr.reduce((result, item) => {
    if (item.key === '__typename') {
      return result;
    } 
    result[item.key] = item.value;
    return result;
  }, {});
  if (isEmpty(result)) {
    return null;
  }
  return result;
}
