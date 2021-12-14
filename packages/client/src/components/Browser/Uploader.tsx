import React from 'react';
import { getAccessToken } from 'utils/env';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Upload, Icon } from 'antd';
import { errorHandler } from 'utils/errorHandler';
import axios, { Canceler } from 'axios';
import { toGroupPath } from 'utils/';

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
  phfsPrefix: string;
  onFileUpload?: () => void;
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

function joinPath(...paths: string[]) {
  /**
   * Join and normalize the paths to the format 'this/is/a/path'
   */
  const path = paths
    .filter(s => s)
    .flatMap(s => s.split('/'))
    .filter(s => s.length > 0)
    .join('/');
  return path;
}

function _Uploader(props: Props) {
  const [files, setFiles] = React.useState([]);
  const { groupName, phfsPrefix, onFileUpload, deleteFiles } = props;
  const graphqlEndpoint = window.absGraphqlEndpoint
    ? window.absGraphqlEndpoint
    : window.graphqlEndpoint;
  React.useEffect(() => {
    setFiles([]);
  }, [groupName, phfsPrefix]);

  function xhrRequest({ file, onError, onProgress, onSuccess }) {
    const filePath = joinPath(
      'groups',
      toGroupPath(groupName),
      phfsPrefix,
      file.name
    );
    const endpoint = graphqlEndpoint.replace('/graphql', `/files/${filePath}`);
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
        if (onFileUpload) {
          onFileUpload();
        }
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
            const phfsPath = joinPath(phfsPrefix, originFile.name);
            deleteFiles({
              variables: {
                where: {
                  groupName,
                  phfsPrefix: phfsPath,
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

export default compose(
  graphql(DELETE_FILES, {
    options: () => ({
      onError: errorHandler,
    }),
    name: 'deleteFiles',
  })
)(_Uploader);
