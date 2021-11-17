import * as React from 'react';
import { Row, Col, Form, AutoComplete } from 'antd';
import { uniq, sortBy, flatMap, get, defaultTo } from 'lodash';
import type { FormComponentProps } from 'antd/lib/form';

import ImagePullSecret from 'components/share/ImagePullSecret';
import ImageType from 'constant/ImageType';
import type { Image as TImage } from 'admin/Images';

type Image = Omit<TImage, 'groups' | 'imageSpec' | 'jobStatus'>;
interface Props extends FormComponentProps<unknown> {
  imageSpec?: unknown;
  disabled?: boolean;
  availableImages: Image[];
}

function getImageOptions({
  images,
  keyword,
}: {
  images?: Image[];
  keyword: string;
}) {
  const urlDict: Record<string, string> = {};
  const secretDict: Record<string, string> = {};

  const availableImages =
    images?.length > 0 ? images.filter(image => image.isReady) : [];

  const sortedImage = uniq(
    sortBy(
      flatMap(
        availableImages,
        ({
          displayName,
          type,
          url,
          urlForGpu,
          groupName,
          useImagePullSecret,
        }) => {
          const scopeType = groupName ? 'Group' : 'System';

          if (type === ImageType.ALL && url !== urlForGpu) {
            urlDict[`${displayName} (${scopeType} / CPU)`] = url;
            urlDict[`${displayName} (${scopeType} / GPU)`] = urlForGpu || url;
            secretDict[url] = useImagePullSecret;
            secretDict[urlForGpu] = useImagePullSecret;

            return [
              `${displayName} (${scopeType} / CPU)`,
              `${displayName} (${scopeType} / GPU)`,
            ];
          } else if (type === ImageType.GPU) {
            urlDict[`${displayName} (${scopeType} / GPU)`] = url;
            secretDict[url] = useImagePullSecret;

            return `${displayName} (${scopeType} / GPU)`;
          } else {
            urlDict[`${displayName} (${scopeType} / CPU)`] = url;
            secretDict[url] = useImagePullSecret;

            return `${displayName} (${scopeType} / CPU)`;
          }
        }
      )
    )
  );

  const dataSource = sortedImage
    .filter(text => text.indexOf(keyword) > -1)
    .map((text, i) => {
      const index = text.indexOf(keyword);
      const name = (
        <span>
          {text.substr(0, index)}
          <b>{text.substr(index, keyword.length)}</b>
          {text.substr(index + keyword.length)}
        </span>
      );

      return {
        // Added a prefix `__` into value make option is independent
        // ref bug: https://github.com/ant-design/ant-design/issues/11909
        text: name,
        value: `${i}__${urlDict[text]}`,
      };
    });

  return {
    dataSource,
    secretDict,
  };
}

export default function BaseImageRow({
  form,
  imageSpec,
  availableImages,
  disabled,
}: Props) {
  const [keyword, setKeyword] = React.useState('');
  const { dataSource, secretDict } = getImageOptions({
    images: availableImages,
    keyword,
  });

  function onSelect(value: string) {
    const url = value.split('__')[1];
    const secret = defaultTo(get(secretDict, url), '');

    form.setFieldsValue({
      'imageSpec.baseImage': url,
      'imageSpec.pullSecret': secret,
    });
  }

  return (
    <Row gutter={24}>
      <Col span={12}>
        <Form.Item label='Base Image URL' style={{ marginBottom: '12px' }}>
          {form.getFieldDecorator('imageSpec.baseImage', {
            initialValue: get(imageSpec, 'baseImage', ''),
            rules: [
              {
                required: true,
                message: 'Please give a base image URL',
              },
            ],
          })(
            <AutoComplete
              data-testid='baseImageUrl'
              style={{ width: '100%' }}
              onSearch={text => setKeyword(text)}
              optionLabelProp='value'
              onSelect={onSelect}
              disabled={disabled}
              // @ts-ignore
              dataSource={dataSource}
            />
          )}
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label={`Image Pull Secret`}>
          <div data-testid='baseImagePullSecret'>
            {form.getFieldDecorator('imageSpec.pullSecret', {
              initialValue: get(imageSpec, 'pullSecret'),
            })(<ImagePullSecret disabled={disabled} />)}
          </div>
        </Form.Item>
      </Col>
    </Row>
  );
}
