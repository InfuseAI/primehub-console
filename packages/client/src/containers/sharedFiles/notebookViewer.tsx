import * as React from 'react';
import { useEffect, useState } from 'react';

import NbViewer from 'react-nbviewer'
import './nbviewer.css'

import Markdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'


const MarkdownAdapter = (props) => {
  return <Markdown children={props.source} />
}

function NotebookViewer(props) {
  const [value, setValue] = React.useState('');
  const filesPattern = /\/preview\/(files.+)/;
  const appPrefix = props.appPrefix;
  let filePath = window.location.href.match(filesPattern)

  if (filePath == null) {
    return (
      <div>File not found</div>
    );
  }

  const fullPath = `${window.location.origin}${appPrefix}${filePath[1]}`;
  useEffect(() => {
    fetch(fullPath)
      .then(res => res.text().then(text => setValue(text)))
      .catch(e => setValue(`Error: cannot fetch content from ${fullPath}`));
  }, [props.location]);

  if (value.startsWith('Error:')) {
    return (
      <div>{value}</div>
    );
  }

  if (value.startsWith('{') && value.endsWith('}')) {
    return (
      <NbViewer
        source={value}
        markdown={MarkdownAdapter}
        code={SyntaxHighlighter} />

    );
  }

  return (
    <div>Loading ...</div>
  );
}



export default NotebookViewer;
