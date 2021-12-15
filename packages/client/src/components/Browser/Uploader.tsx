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

export const TEXT_UPLOAD_IN_BG = 'Upload in Background';
export const TEXT_UPLOAD_IN_BG_MSG =
  'Upload is still in progress. To upload in background, you will not know the progress anymore. Are you sure to upload in background?';

interface Props {
  groupName: string;
  phfsPrefix: string;
  onFileUpload?: () => void;
  onUploadStatusChange?: (uploading: boolean) => void;
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
  const [fileList, setFileList] = React.useState([]);
  const [, setUploading] = React.useState(false);
  const { groupName, phfsPrefix, onFileUpload, deleteFiles } = props;
  const graphqlEndpoint = window.absGraphqlEndpoint
    ? window.absGraphqlEndpoint
    : window.graphqlEndpoint;
  React.useEffect(() => {
    setFileList([]);
  }, [groupName, phfsPrefix]);

  function customRequest({ file, onError, onProgress, onSuccess }) {
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
        onSuccess(response, file);
        if (onFileUpload) {
          onFileUpload();
        }
      })
      .catch(onError);
  }

  return (
    <>
      <Dragger
        fileList={fileList}
        multiple={true}
        customRequest={customRequest}
        beforeUpload={file => {
          // check if the file already in the filelist.
          console.log('beforeUpload', file, fileList);
          if (fileList.map(f => f.name).includes(file.name)) {
            return false;
          }
          return true;
        }}
        onChange={info => {
          console.log('upload onChange', info);
          const { onUploadStatusChange } = props;

          // Add one or multiple files in the upload list.
          setFileList(prevFileList => {
            const names = prevFileList.map(f => f.name);
            const filtered = info.fileList.filter(f => !names.includes(f.name));
            return [...prevFileList, ...filtered];
          });

          // Trigger upload status change
          if (onUploadStatusChange) {
            let uploading = false;
            for (const file of info.fileList) {
              if (file.status === 'uploading') {
                uploading = true;
                break;
              }
            }
            setUploading(prevUploading => {
              if (prevUploading !== uploading) {
                onUploadStatusChange(uploading);
              }
              return uploading;
            });
          }
        }}
        onRemove={uploadFile => {
          const file: any = uploadFile.originFileObj;
          if (uploadFile.status !== 'uploading') {
            // delete the uploaded file
            const phfsPath = joinPath(phfsPrefix, file.name);
            deleteFiles({
              variables: {
                where: {
                  groupName,
                  phfsPrefix: phfsPath,
                },
              },
            });
          } else {
            // cancle the uploading file
            if (file.cancel) {
              file.cancel();
            }
            const cancel: Canceler = file.cancel;
            if (!cancel) {
              return false;
            }
            cancel();
          }
          setFileList(prevFiles => prevFiles.filter(f => f.name !== file.name));
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
