import * as React from 'react';
import { get } from 'lodash';
import { Row, Col, Form, Card, Input } from 'antd';
import BaseImageRow from './baseImageRow';

const {TextArea} = Input;

interface Props {
  form: any;
  imageSpec: any;
  packages: any;
  availableImages: any[];
}

export default class BuildCustomImageForm extends React.Component<Props> {
  packagesLabelList: Array<{ label: string, fieldName: string }>;
  constructor(props: Props) {
    super(props);
    this.packagesLabelList = [
      {
        label: 'APT',
        fieldName: 'imageSpec.packages.apt'
      },
      {
        label: 'Conda',
        fieldName: 'imageSpec.packages.conda'
      },
      {
        label: 'pip',
        fieldName: 'imageSpec.packages.pip'
      },
    ];
  }

  renderPackageFields() {
    const {form, packages} = this.props;
    const placeholder = `one package per line. e.g. \npackage1\npackage2\n`;
    return this.packagesLabelList.map(data => {
      const key = (get(data, 'fieldName', '').split('.'))[2];
      return (
        <Col span={8}>
          <Form.Item label={data.label} style={{marginBottom: '10px'}}>
            {form.getFieldDecorator(data.fieldName, {
              initialValue: get(packages, key),
            })(
              <TextArea rows={4} placeholder={placeholder}/>
            )}
          </Form.Item>
        </Col>
      );
    });
  }

  render() {
    return (
      <>
        <BaseImageRow {...this.props} />
        <Form.Item label='Package(s)' required={true}>
          <Card>
            <Row gutter={24}>
              {this.renderPackageFields()}
            </Row>
          </Card>
        </Form.Item>
      </>
    );
  }
}
