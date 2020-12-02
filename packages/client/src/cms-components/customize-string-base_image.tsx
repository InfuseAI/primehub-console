// @flow

import React, { PureComponent } from "react";
import { AutoComplete } from "antd";
import defaultMessage from "@canner/antd-locales";
import {injectIntl} from 'react-intl';
import RefId from 'canner-ref-id';
import gql from 'graphql-tag';
import {flatMap, uniq} from 'lodash';

const Option = AutoComplete.Option;

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
    displayName
    type
    url
    urlForGpu
  }
}
`
const appPrefix = (window as any).APP_PREFIX || '/';

const url_dict: { [key: string]: string; } = {};

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
    client.query({
      query: IMAGES,
      variables: {
        where: {}
      }
    }).then(result => {
      this.setState({
        images: result.data.images
      });
    })
  }

  handleSearch = searchText => {
    this.setState({searchText});
  }

  onChange = (val: string) => {
    this.props.onChange(this.props.refId, "update", (val in url_dict) ? url_dict[val] : val);
  };

  render() {
    const { value, disabled, intl } = this.props;
    let { uiParams } = this.props;
    const {images, searchText} = this.state;
    const {style} = uiParams;
    const dataSource = uniq(flatMap(images, image => {
      const {displayName, type, url, urlForGpu} = image;
      if (type === 'both' && url !== urlForGpu) {
        url_dict[`${displayName} (CPU)`] = url
        url_dict[`${displayName} (GPU)`] = urlForGpu
        return [
          `${displayName} (CPU)`,
          `${displayName} (GPU)`
        ];
      }
      else if (type === 'gpu') {
        url_dict[`${displayName} (GPU)`] = url
        return `${displayName} (GPU)`
      }
      else {
        url_dict[`${displayName} (CPU)`] = url
        return `${displayName} (CPU)`
      }
    }))
    .filter(url => url.indexOf(searchText) > -1)
    .map((url, i) => {
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
    })
    return (
      <AutoComplete
        style={style || {}}
        dataSource={dataSource}
        disabled={disabled}
        showSearch
        value={value}
        onSearch={this.handleSearch}
        placeholder={
          intl.formatMessage({
            id: "buildImage.baseImage.placeholder",
            defaultMessage: defaultMessage.en["buildImage.baseImage.placeholder"]
          })
        }
        showArrow={false}
        onChange={this.onChange}
        filterOption={false}
        optionLabelProp="value"
      />
    );
  }
}