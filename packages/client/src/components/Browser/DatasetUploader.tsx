import React from 'react';
import * as tus from 'tus-js-client';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { compose } from 'recompose';
import { Upload, Icon } from 'antd';
import { errorHandler } from 'utils/errorHandler';
import { getAccessToken } from 'utils/env';

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
  const endpoint = graphqlEndpoint.replace('/graphql', '/tus');
  const dirpath = `groups/${groupName}/datasets/${datasetId}/`;

  React.useEffect(() => {
    setFiles([]);
  }, [groupName, datasetId]);

  function customRequest({ onSuccess, onProgress, onError, file }) {
    const upload: tus.Upload = file.uploader;
    upload.options.onError = err => {
      console.log('Error: ', err);
      onError(err, file);
    };
    upload.options.onProgress = (bytesUploaded, bytesTotal) => {
      const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      onProgress({ percent: Number(percentage) }, file);
    };
    upload.options.onSuccess = () => {
      file.done = true;
      onSuccess(null, file);
    };
    upload.options.headers = {
      authorization: `Bearer ${getAccessToken()}`,
    };

    upload.findPreviousUploads().then(previousUploads => {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      // Start the upload
      upload.start();
    });
  }

  function beforeUpload(file, FileList) {
    if (files.map(f => f.name).includes(file.name)) {
      return false;
    }

    file.uploader = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type,
        dirpath,
      },
    });

    return true;
  }

  return (
    <>
      <Dragger
        multiple={true}
        fileList={files}
        customRequest={customRequest}
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
          const upload: tus.Upload = originFile.uploader;
          if (!upload) {
            return false;
          }
          upload
            .abort(true)
            .then(async () => {
              return true;
            })
            .catch(err => {
              console.log('Error: ', err);
              return false;
            });
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
