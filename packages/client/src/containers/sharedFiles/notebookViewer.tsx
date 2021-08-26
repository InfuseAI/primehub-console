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

  useEffect(() => {
    fetch(url).then(res => res.text().then(text => setValue(text)));
  }, [props.location]);


  return (
    <NbViewer
      source={value}
      markdown={MarkdownAdapter}
      code={SyntaxHighlighter} />

  );
}



export default NotebookViewer;
