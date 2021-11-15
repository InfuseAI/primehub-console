import React from 'react';
import RcUpload from 'rc-upload';
import { Upload } from 'tus-js-client';
import { Button, Icon } from 'antd';
import { getAccessToken } from 'utils/env';

interface Props {
  dirPath: string;
}

export function DatasetUploader(props: Props) {
  const [fileList, setFileList] = React.useState([]);
  const [dragState, setDragState] = React.useState('');

  const { dirPath } = props;
  const graphqlEndpoint = window.absGraphqlEndpoint
    ? window.absGraphqlEndpoint
    : window.graphqlEndpoint;
  const endpoint = graphqlEndpoint.replace('/graphql', '/tus');

  const headers = {
    authorization: `Bearer ${getAccessToken()}`,
  };

  function onFileDrop(e) {
    setDragState(e.type);
  }

  function customRequest({ onSuccess, onProgress, onError, file }) {
    console.log('customRequest', file);
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type,
        dirpath: dirPath,
      },
      headers,
      onError: err => {
        console.log('err', err);
        onError(err, file);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, percentage + '%');
        // onProgress({ percent: +percentage }, file);
      },
      onSuccess: () => {
        onSuccess(null, file);
      },
    });
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
    console.log('beforeUpload', file);
    console.log('beforeUpload', FileList);
    setFileList(prevFiles => {
      const names = prevFiles.map(f => f.name);
      const filtered = FileList.filter(f => !names.includes(f.name));
      return [...prevFiles, ...filtered];
    });
  }

  const dragDropStyle = {
    padding: 10,
    border: `3px dashed ${dragState === 'dragover' ? '#5b7cc9' : 'lightgrey'}`,
    backgroundColor: '#fafaff',
  };
  const uploaded = fileList.length > 0;

  return (
    <>
      <div
        style={dragDropStyle}
        onDrop={onFileDrop}
        onDragOver={onFileDrop}
        onDragLeave={onFileDrop}
      >
        <RcUpload
          customRequest={customRequest}
          beforeUpload={beforeUpload}
          openFileDialogOnClick={!uploaded}
          multiple={true}
        >
          {uploaded ? (
            <div>
              <b>Uploaded Files</b>
              {fileList.map(file => (
                <div key={file.uid}>
                  <span>{file.name}</span>
                  <Icon
                    type='delete'
                    onClick={() => {
                      console.log('remove', file);
                      setFileList(prevFiles =>
                        prevFiles.filter(f => f !== file)
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 20px 0' }}>
                <Icon
                  type='inbox'
                  style={{ color: '#5b7cc9', fontSize: '48px' }}
                />
              </p>
              <p
                style={{
                  margin: '0 0 4px 0',
                  color: 'rgba(0, 0, 0, 0.85);',
                  fontSize: '16px',
                }}
              >
                Click or drag file to this area to upload
              </p>
              <p style={{ color: 'rgba(0, 0, 0, 0.45);', fontSize: '14px' }}>
                Support for a single or bulk upload. Strictly prohibit from
                uploading company data or other band files
              </p>
            </div>
          )}
        </RcUpload>
      </div>
      <div
        style={{
          marginTop: 20,
          textAlign: uploaded ? 'left' : 'center',
        }}
      >
        {!uploaded && (
          <div
            style={{
              marginBottom: 20,
            }}
          >
            Or
          </div>
        )}
        <RcUpload
          multiple={true}
          customRequest={customRequest}
          beforeUpload={beforeUpload}
        >
          <Button>
            <Icon type='upload' />{' '}
            {uploaded ? 'Upload more files' : 'Click to Upload'}
          </Button>
        </RcUpload>
      </div>
    </>
  );
}
