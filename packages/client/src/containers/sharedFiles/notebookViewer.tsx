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
  const url = 'https://qty0712-microk8s.aws.primehub.io/console/files/groups/phusers/00-getting-started.ipynb';

    // Effect for original user data
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
