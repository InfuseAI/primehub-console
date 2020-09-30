import * as React from 'react';
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import {errorHandler} from '../components/job/errorHandler';
import {get} from 'lodash';
import {appPrefix} from 'utils/env';
import { Table } from 'antd';

type Props = {
  jobId: string;
  data?: any;
};

export const GET_PH_JOB_ARTIFACT = gql`
  query phJob($where: PhJobWhereUniqueInput!) {
    phJob(where: $where) {
      id
      artifact {
        prefix
        items {
          name
          size
          lastModified
        }
      }
    }
  }
`;

const getMessage = error => get(error, 'graphQLErrors.0.extensions.code') === 'NOT_AUTH' ? `You're not authorized to view this page.` : 'Error';
const isArtifactEnabled = (): boolean => {
  return (window as any).enablePhfs && (window as any).enableJobArtifact;
};

// Ref: https://stackoverflow.com/a/14919494/563353
const humanFileSize = (bytes, si=false, dp=1) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + ' ' + units[u];
};

class JobArtifactContainer extends React.Component<Props> {
  public render = () => {
    const {data} = this.props;

    if (!isArtifactEnabled()) {
      return 'Artifact is not enabled';
    }

    if (!data.phJob) {
      return null;
    }

    if (data.error) {
      return getMessage(data.error);
    }

    if (data.loading) {
      return 'Loading...';
    }

    const columns = [
      {
        title: 'File',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size',
      },
    ];
    let dataSource = [];

    if (data.phJob && data.phJob.artifact && data.phJob.artifact.items) {
      const prefix = data.phJob.artifact.prefix;
      dataSource = data.phJob.artifact.items.map(item =>
        ({
          name: <a href={`${appPrefix}files/${prefix}/${item.name}`}>{item.name}</a>,
          size: humanFileSize(item.size, true, 1),
        })
      );
    }

    const pagination = {
      hideOnSinglePage: true,
      showSizeChanger: true,
      defaultPageSize: 25,
      pageSizeOptions: ['10', '25', '50', '100']
    };

    return <Table dataSource={dataSource} columns={columns} pagination={pagination}/>;
  }
}

export default graphql(GET_PH_JOB_ARTIFACT, {
  options: (props: Props) => ({
    variables: {
      where: {
        id: props.jobId
      }
    },
    fetchPolicy: 'network-only',
    onError: errorHandler,
    skip: !isArtifactEnabled(),
  }),
})(JobArtifactContainer);
