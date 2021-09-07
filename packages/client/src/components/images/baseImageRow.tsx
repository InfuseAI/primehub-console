import * as React from 'react';
import { Row, Col, Form, AutoComplete, Select } from 'antd';
import ImagePullSecret from 'components/share/ImagePullSecret';
import ImageType from 'constant/ImageType';
import { uniq, sortBy, flatMap, get, defaultTo } from 'lodash';
const {Option} = Select;

interface Props {
  form: any;
  imageSpec?: any;
  disabled?: boolean;
  availableImages: any[];
}

interface State {
  searchText: string;
}

export default class BaseImageRow extends React.Component<Props, State> {
  urlDict: { [key: string]: string; };
  secretDict: { [key: string]: string; };
  disabled: boolean;

  constructor(props) {
    super(props);
    this.state = {
      searchText: ''
    };
    this.urlDict = {};
    this.secretDict = {};
  }

  onSearch = (searchText: string) => {
    this.setState({searchText});
  }

  onSelect = (value: string) => {
    const secret = defaultTo(get(this.secretDict, value), '');
    const {form} = this.props;
    form.setFieldsValue({'imageSpec.pullSecret': secret});
  }

  getDataSource() {
    const availableImages =
      this.props.availableImages ? this.props.availableImages.filter(image => image.isReady) : [];
    const { searchText } = this.state;
    const dataSource = uniq(sortBy(flatMap(availableImages, image => {
      const {displayName, type, url, urlForGpu, groupName, useImagePullSecret} = image;
      const scopeType = groupName ? 'Group' : 'System';
      if (type === ImageType.ALL && url !== urlForGpu) {
        this.urlDict[`${displayName} (${scopeType} / CPU)`] = url;
        this.urlDict[`${displayName} (${scopeType} / GPU)`] = urlForGpu || url;
        this.secretDict[url] = useImagePullSecret;
        this.secretDict[urlForGpu] = useImagePullSecret;
        return [
          `${displayName} (${scopeType} / CPU)`,
          `${displayName} (${scopeType} / GPU)`
        ];
      } else if (type === ImageType.GPU) {
        this.urlDict[`${displayName} (${scopeType} / GPU)`] = url;
        this.secretDict[url] = useImagePullSecret;
        return `${displayName} (${scopeType} / GPU)`;
      } else {
        this.urlDict[`${displayName} (${scopeType} / CPU)`] = url;
        this.secretDict[url] = useImagePullSecret;
        return `${displayName} (${scopeType} / CPU)`;
      }
    })))
    .filter(text => text.indexOf(searchText) > -1)
    .map(text => {
      const index = text.indexOf(searchText);
      const name = <span>
        {text.substr(0, index)}
        <b>{text.substr(index, searchText.length)}</b>
        {text.substr(index + searchText.length)}
      </span>;
      return (
        <Option value={this.urlDict[text]} key={this.urlDict[text]}>
          {name}
        </Option>
      );
    });
    return dataSource;
  }

  render() {
    const {
      form,
      imageSpec,
      disabled,
    } = this.props;
    return (
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label='Base Image URL' style={{marginBottom: '12px'}}>
            {form.getFieldDecorator('imageSpec.baseImage', {
              initialValue: get(imageSpec, 'baseImage', ''),
              rules: [
                {
                  required: true,
                  message: 'Please give a base image URL'
                }
              ]
            })(
              <AutoComplete
                data-testid='baseImageUrl'
                style={{width: '100%'}}
                dataSource={this.getDataSource()}
                onSearch={this.onSearch}
                optionLabelProp='value'
                onSelect={this.onSelect}
                disabled={disabled}
              />
            )}
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={`Image Pull Secret`}>
            <div data-testid='baseImagePullSecret'>
              {form.getFieldDecorator('imageSpec.pullSecret', {
                initialValue: get(imageSpec, 'pullSecret'),
              })(
                <ImagePullSecret disabled={disabled}/>
              )}
            </div>
          </Form.Item>
        </Col>
      </Row>
    );
  }
}
