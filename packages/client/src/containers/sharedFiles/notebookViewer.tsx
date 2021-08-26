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
  const url = new URLSearchParams(window.location.search).get('file') || '';

  if (url === '') {
    return (
      <div>File not found</div>
    );
  }

  useEffect(() => {
    fetch(url)
      .then(res => res.text().then(text => setValue(text)))
      .catch(e => setValue(`Error: cannot fetch content from ${url}`));
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
    <div>invalid content</div>
  );
}



export default NotebookViewer;
