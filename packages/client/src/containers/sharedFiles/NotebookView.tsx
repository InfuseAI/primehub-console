import React, { useEffect } from 'react';

import NbViewer from 'react-nbviewer';
import './nbviewer.css';

import Markdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import SharingOptions from './NotebookShareOptions';

const loadingNotebook = `{
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

const errorNotebook = `{
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

const MarkdownAdapter = props => {
  return <Markdown children={props.source} />;
};

interface NotebookProps {
  appPrefix: string;
  previewFile?: string;
  sharable?: boolean;
}

function NotebookViewer(props: NotebookProps) {
  const [value, setValue] = React.useState(loadingNotebook);
  const { appPrefix, previewFile, sharable } = props;
  const getPreviewURL = () => {
    if (previewFile) {
      return previewFile;
    }

    // resolve the URL from the current location
    const filesPattern = /\/preview\/(files.+)/;
    const filePath = window.location.href.match(filesPattern);
    if (filePath == null) {
      return <div>File not found</div>;
    }
    const fullPath = `${window.location.origin}${appPrefix}${filePath[1]}`;
    return fullPath;
  };

  const fullPath = getPreviewURL();

  const showError = (reason: string, content: string) => {
    setValue(
      errorNotebook.replace('$REASON', reason).replace('$CONTENT', content)
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(fullPath as string);
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
  }, []);

  return (
    <div>
      <SharingOptions
        hidden={previewFile ? true : false}
        inGroupPreview={false}
      />
      <NbViewer
        source={value}
        markdown={MarkdownAdapter}
        code={SyntaxHighlighter}
      />
    </div>
  );
}

export default NotebookViewer;
