import React from 'react';
import {merge} from 'lodash';
import {Input, Icon, Button} from 'antd';
import {Empty} from '../empty';
import {DefaultEnv} from 'interfaces/phAppTemplate';

const InputGroup = Input.Group;

interface Props {
  defaultEnv?: DefaultEnv[];
  reloadDefault?: boolean;
  onChange?: (value: object) => void;
  disabled?: boolean;
  value?: object;
  empty?: React.ReactNode;
  reveal: boolean;
  enableReveal: boolean;
}

interface State {
  fields: any[];
  errorIndex?: number;
  errorMessage?: string;
}

export default class EnvFields extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const {value, defaultEnv} = props;
    const defaultEnvs = defaultEnv ? defaultEnv.map(item => {
      return {name: item.name, value: item.defaultValue};
    }) : [];
    const envs = value ? value.map(env => {
      return {name: env.name, value: env.value};
    }) : [];
    this.state = {
      fields: merge(defaultEnvs, envs) || [],
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.defaultEnv !== this.props.defaultEnv || this.props.reloadDefault === true) {
      const {defaultEnv} = this.props;
      const defaultEnvs = defaultEnv ? defaultEnv.map(item => {
        return {name: item.name, value: item.defaultValue, required: !item.optional};
      }) : [];
      this.setState({fields: defaultEnvs});
    }
  }

  add = () => {
    const {onChange} = this.props;
    this.setState({
      fields: this.state.fields.concat({name: '', value: ''}),
      errorIndex: -1,
    }, () => {
      onChange(this.state.fields);
    });
  }

  remove = index => {
    const {fields} = this.state;
    const {onChange} = this.props;
    fields.splice(index, 1);
    this.setState({
      fields,
      errorIndex: -1,
    }, () => {
      onChange(this.state.fields);
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
      onChange(this.state.fields);
    });
  }

  changeName = (name, index) => {
    const {fields} = this.state;
    const {onChange} = this.props;
    fields[index].name = name;
    this.setState({
      fields,
      errorIndex: -1
    }, () => {
      onChange(this.state.fields);
    });
  }

  render() {
    const {fields, errorIndex, errorMessage} = this.state;
    const {enableReveal, reveal, disabled, empty = <Empty
      style={{ width: 'calc(50% + 16px)'}}
      height={200}
      description='Empty.'
    />} = this.props;

    return (
      <React.Fragment>
        {
          fields.length === 0 ? empty : fields.map((field, i) => {
            const valueItem = <Input
                    disabled={disabled}
                    placeholder='value'
                    style={{ width: '60%'}}
                    value={field.value}
                    onChange={e => this.changeValue(e.target.value, i)}
                  />;
            const hiddenValueItem = <Input
                    type='password'
                    disabled={disabled}
                    placeholder='value'
                    style={{ width: '60%'}}
                    value={field.value}
                    onChange={e => this.changeValue(e.target.value, i)}
                  />;
            return (
              <React.Fragment key={i}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: 8, userSelect: 'none'}}>
                  <div style={{marginRight: 16}}>{i + 1}</div>
                  <InputGroup compact style={{width: '50%', marginRight: 16}}>
                    <Input
                      disabled={disabled}
                      placeholder='name' style={{ width: '40%'}}
                      value={field.name}
                      onChange={e => this.changeName(e.target.value, i)}
                    />
                    { enableReveal && !reveal ? hiddenValueItem : valueItem }
                  </InputGroup>
                  {
                    disabled ? null : field.required ? (
                      <Icon type='info-circle' theme='filled' title='Required Environment' />
                    ) : (
                      <a href='javascript:;' onClick={() => this.remove(i)}>
                        <Icon type='close-circle-o'/>
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
            );
          })
        }
        {
          disabled === true ? (
            null
          ) : (
            <Button type='dashed' data-testid='add-field-button' onClick={this.add} style={{ width: 'calc(50% + 16px)', marginTop: 16 }}>
              <Icon type='plus' /> Add field
            </Button>
          )
        }
      </React.Fragment>
    );
  }
}
