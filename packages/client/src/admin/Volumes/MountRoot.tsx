import * as React from 'react';
import { Input } from 'antd';
import { FormattedHTMLMessage } from 'react-intl';

type Props = {
  name: string;
  root?: string;
}

export function MountRoot(props: Props) {
  const { name, root = '/volumes' } = props;
  return (
    <>
      <Input
        disabled
        value={root}
      />
      <div style={{
      color: '#aaa',
      fontSize: 12,
      }}>
        <FormattedHTMLMessage
          id="mountRoot.preview"
          defaultMessage="Data can be access at: "
        />
        {`${root.replace(/\/$/, '')}/${name}`}
      </div>
    </>
  )
}

