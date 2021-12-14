import React from 'react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Upload, Icon } from 'antd';
import { errorHandler } from 'utils/errorHandler';
import { getAccessToken } from 'utils/env';
import { toGroupPath } from 'utils/index';
import axios, { Canceler } from 'axios';

const { Dragger } = Upload;

const DELETE_FILES = gql`
  mutation deleteFiles(
    $where: StoreFileWhereInput!
    $options: StoreFileDeleteOptionInput
  ) {
    deleteFiles(where: $where, options: $options)
  }
`;

interface Props {
  groupName: string;
  datasetId: string;
  deleteFiles: ({
    variables,
  }: {
    variables: {
      where: {
        groupName: string;
        phfsPrefix: string;
      };
    };
  }) => Promise<{ data: { deleteFiles: number } }>;
}

function _DatasetUploader(props: Props) {
  const [files, setFiles] = React.useState([]);
  const { groupName, datasetId, deleteFiles } = props;
  const graphqlEndpoint = window.absGraphqlEndpoint
    ? window.absGraphqlEndpoint
    : window.graphqlEndpoint;
  React.useEffect(() => {
    setFiles([]);
  }, [groupName, datasetId]);

  function xhrRequest({ file, onError, onProgress, onSuccess }) {
    const endpoint = graphqlEndpoint.replace(
      '/graphql',
      `/files/groups/${toGroupPath(groupName)}/datasets/${datasetId}/${file.name}`
    );
    const headers = {
      authorization: `Bearer ${getAccessToken()}`,
    };
    const source = axios.CancelToken.source();
    file.cancel = source.cancel;

    axios
      .post(endpoint, file, {
        cancelToken: source.token,
        headers,
        onUploadProgress: ({ total, loaded }) => {
          onProgress(
            { percent: Math.round((loaded / total) * 100).toFixed(2) },
            file
          );
        },
      })
      .then(({ data: response }) => {
        file.done = true;
        onSuccess(response, file);
      })
      .catch(onError);
  }

  function beforeUpload(file) {
    if (files.map(f => f.name).includes(file.name)) {
      return false;
    }
    return true;
  }

  return (
    <>
      <Dragger
        multiple={true}
        fileList={files}
        customRequest={xhrRequest}
        beforeUpload={beforeUpload}
        onChange={info => {
          setFiles(prevFiles => {
            const names = prevFiles.map(f => f.name);
            const filtered = info.fileList.filter(f => !names.includes(f.name));
            return [...prevFiles, ...filtered];
          });
        }}
        onRemove={file => {
          const originFile: any = file.originFileObj;
          setFiles(prevFiles =>
            prevFiles.filter(f => f.name !== originFile.name)
          );
          if (originFile.done) {
            deleteFiles({
              variables: {
                where: {
                  groupName,
                  phfsPrefix: `datasets/${datasetId}/${originFile.name}`,
                },
              },
            });
            return true;
          }

          if (originFile.cancel) {
            originFile.cancel();
          }
          const cancel: Canceler = originFile.cancel;
          if (!cancel) {
            return false;
          }
          cancel();
          return true;
        }}
      >
        <p className='ant-upload-drag-icon'>
          <Icon type='inbox' />
        </p>
        <p className='ant-upload-text'>
          Click or drag file to this area to upload
        </p>
        <p className='ant-upload-hint'>Support for a single or bulk upload.</p>
      </Dragger>
    </>
  );
}

export const DatasetUploader = compose(
  graphql(DELETE_FILES, {
    options: () => ({
      onError: errorHandler,
    }),
    name: 'deleteFiles',
  })
)(_DatasetUploader);
