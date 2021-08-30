import * as React from 'react';
import { useEffect, useState } from 'react';

import NbViewer from 'react-nbviewer'
import './nbviewer.css'

import Markdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { reject } from 'lodash';

const loadingNotebook: string = `{
  "cells": [
   {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
     "Loading ..."
    ]
   },
   {
    "cell_type": "code",
    "execution_count": null,
    "metadata": {},
    "outputs": [],
    "source": []
   }
  ],
  "metadata": {
   "kernelspec": {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3"
   },
   "language_info": {
    "codemirror_mode": {
     "name": "ipython",
     "version": 3
    },
    "file_extension": ".py",
    "mimetype": "text/x-python",
    "name": "python",
    "nbconvert_exporter": "python",
    "pygments_lexer": "ipython3",
    "version": "3.7.6"
   }
  },
  "nbformat": 4,
  "nbformat_minor": 4
 }`;

const errorNotebook: string = `{
  "cells": [
   {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
     "### Error"
    ]
   },
   {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
     "Reason: $REASON"
    ]
   },
   {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
     "Content: $CONTENT"
    ]
   }
  ],
  "metadata": {
   "kernelspec": {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3"
   },
   "language_info": {
    "codemirror_mode": {
     "name": "ipython",
     "version": 3
    },
    "file_extension": ".py",
    "mimetype": "text/x-python",
    "name": "python",
    "nbconvert_exporter": "python",
    "pygments_lexer": "ipython3",
    "version": "3.7.6"
   }
  },
  "nbformat": 4,
  "nbformat_minor": 4
 }`;


const MarkdownAdapter = (props) => {
  return <Markdown children={props.source} />
}

function NotebookViewer(props) {
  const [value, setValue] = React.useState(loadingNotebook);
  const filesPattern = /\/preview\/(files.+)/;
  const appPrefix = props.appPrefix;
  let filePath = window.location.href.match(filesPattern)

  if (filePath == null) {
    return (
      <div>File not found</div>
    );
  }

  const fullPath = `${window.location.origin}${appPrefix}${filePath[1]}`;

  const showError = (reason: string, content: string) => {
    setValue(errorNotebook.replace('$REASON', reason).replace('$CONTENT', content));
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(fullPath);
        if (response.status === 200) {
          const text = await response.text();
          const data = JSON.parse(text);
          if (data['nbformat'] === 4) {
            setValue(text);
          } else {
            showError('Not a valid ipynb', text);
          }
        } else {
          showError(`bad request`, `cannot fetch content from ${fullPath}`);
        }
      } catch (error) {
        showError(`${error}`, `cannot fetch content from ${fullPath}`);
      }
    })();
  }, [props.location]);

  return (
    <NbViewer
      source={value}
      markdown={MarkdownAdapter}
      code={SyntaxHighlighter} />
  );
}

export default NotebookViewer;
