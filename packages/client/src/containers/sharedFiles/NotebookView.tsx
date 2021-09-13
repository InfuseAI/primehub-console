import React, { useEffect } from 'react';

import NbViewer from 'react-nbviewer';

import Markdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Icon, Affix } from 'antd';
import { Logo } from 'containers/sharedFiles/NotebookShareOptions';

const messageNotebook = `{
  "cells": [
   {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
     "$MESSAGE"
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
  previewFile?: string;
}

function toPublicDownloadLink(): string {
  // resolve the URL from the current location
  const filesPattern = /\/share\/(.+)/;
  const sharedHash = window.location.href.match(filesPattern);
  if (sharedHash == null) {
    return null;
  }

  let apiHost = window.absGraphqlEndpoint.replace('/graphql', '');
  if (!apiHost.endsWith('/')) {
    apiHost = apiHost + '/';
  }
  return `${apiHost}share/${sharedHash[1]}`;
}

const Header = (props: { downloadLink: string }) => {
  return (
    <div className='header_container' style={{ backgroundColor: '#373d62' }}>
      <Logo />
      <div className='header_operations'>
        <a
          href={props.downloadLink}
          data-testid='download-url'
          rel='noreferrer'
        >
          <Icon type='download' className='header_icon' />
        </a>
      </div>
    </div>
  );
};

function NotebookViewer(props: NotebookProps) {
  const [value, setValue] = React.useState(
    messageNotebook.replace('$MESSAGE', 'Loading ...')
  );
  const { previewFile } = props;

  let fullPath = previewFile;
  if (!fullPath) {
    fullPath = toPublicDownloadLink();
  }

  const isSharedPage = fullPath.includes('/share/');
  const fileNotFound = () => {
    setValue(
      messageNotebook.replace(
        '$MESSAGE',
        'The file is not currently shared or has been deleted.'
      )
    );
  };

  useEffect(() => {
    async function fetchPath() {
      try {
        const response = await fetch(fullPath);
        if (response.status === 200) {
          const text = await response.text();
          const data = JSON.parse(text);
          if (data['nbformat'] === 4) {
            setValue(text);
          } else {
            fileNotFound();
          }
        } else {
          fileNotFound();
        }
      } catch (error) {
        fileNotFound();
      }
    }

    fetchPath();
  }, [fullPath]);

  return (
    <div>
      {isSharedPage && (
        <Affix offsetTop={0}>
          <Header downloadLink={fullPath + '?download=1'} />
        </Affix>
      )}
      <NbViewer
        key='nbviewer'
        source={value}
        markdown={MarkdownAdapter}
        code={SyntaxHighlighter}
      />
    </div>
  );
}

export default NotebookViewer;
