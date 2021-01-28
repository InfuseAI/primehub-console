import * as React from 'react';

export default class LicenseUsage extends React.Component {
  constructor(props) {
    super(props);
  }

  getUsage() {
    const {keyName, rootValue} = this.props;
    if (rootValue.system &&
      rootValue.system.license &&
      rootValue.system.license.usage &&
      rootValue.system.license[keyName] &&
      rootValue.system.license.usage[keyName]) {

      const license = rootValue.system.license;
      const limit = license[keyName] === -1 ? '∞' : license[keyName];
      return `${license.usage[keyName]}/${limit}`;
    }
    return '';
  }

  render() {
    return <span>{this.getUsage()}</span>;
  }
}
