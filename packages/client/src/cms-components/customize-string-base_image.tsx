// @flow

import React, { PureComponent } from "react";
import { Select } from "antd";
import defaultMessage from "@canner/antd-locales";
import {injectIntl} from 'react-intl';
import RefId from 'canner-ref-id';
import gql from 'graphql-tag';
import {flatMap} from 'lodash';

const Option = Select.Option;

// types
type UIParams = {
  options: Array<{
    text: string,
    value: string
  }>,
  style: any;
  defaultSelected?: number
};

type Props =  {
  uiParams: UIParams;
  intl: any;
  onChange: (refId: RefId, action: string, value: any) => void;
  value: any;
  disabled: boolean;
  refId: RefId;
};

const IMAGES = gql`
query images($where: ImageWhereInput!) {
  images(where: $where) {
    id
    name
    url
    urlForGpu
  }
}
`
const appPrefix = (window as any).APP_PREFIX || '/';

@injectIntl
export default class SelectString extends PureComponent<Props> {
  static defaultProps = {
    uiParams: {
      options: []
    }
  };

  state = {
    images: [],
    searchText: '',
  }

  componentDidMount() {
    const {client} = this.props;
    const regex = new RegExp(`${appPrefix}cms/([^/]+)/buildImage`);
    const result = location.pathname.match(regex)
    console.log(location.pathname, result);
    client.query({
      query: IMAGES,
      variables: {
        where: {
          workspaceId: result && result[1]
        }
      }
    }).then(result => {
      console.log(result);
      this.setState({
        images: result.data.images
      });
    })
  }

  handleSearch = searchText => {
    this.setState({searchText});
  }

  onChange = (val: string) => {
    this.setState({searchText: ''});
    this.props.onChange(this.props.refId, "update", val);
  };

  render() {
    const { value, disabled, intl } = this.props;
    let { uiParams } = this.props;
    const {images, searchText} = this.state;
    const {style} = uiParams;
    return (
      <Select
        style={style || {}}
        disabled={disabled}
        showSearch
        value={value}
        onSearch={this.handleSearch}
        placeholder={
          intl.formatMessage({
            id: "string.select.placeholder",
            defaultMessage: defaultMessage.en["string.select.placeholder"]
          })
        }
        showArrow={false}
        onChange={this.onChange}
        filterOption={false}
      >
        {flatMap(images, image => {
          const {urlForGpu, url} = image;
          if (urlForGpu && url !== urlForGpu)
            return [
              image,
              {...image, url: image.urlForGpu}
            ];
          return image
        })
        .filter(image => image.url.indexOf(searchText) > -1)
        .map((opt, i) => {
          const { url } = opt;
          const index = url.indexOf(searchText);
          const name = <span>
            {url.substr(0, index)}
            <b>{url.substr(index, searchText.length)}</b>
            {url.substr(index + searchText.length)}
          </span>
          return (
            <Option value={url} key={url}>
              {name}
            </Option>
          );
        })}
      </Select>
    );
  }
}