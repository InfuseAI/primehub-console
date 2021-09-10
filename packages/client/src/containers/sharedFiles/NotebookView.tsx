import React, { useEffect } from 'react';

import NbViewer from 'react-nbviewer';

import Markdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Icon } from 'antd';
import { Logo } from 'containers/sharedFiles/NotebookShareOptions';

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

function toPublicDownloadLink(sharedHash) {
  let apiHost = window.absGraphqlEndpoint.replace('/graphql', '');
  // if (window.graphqlPrefix !== '/') {
  //   apiHost = apiHost.replace(window.graphqlPrefix, '');
  // }
  console.log("[1] apiHost", apiHost);
  if (!apiHost.endsWith('/')) {
    apiHost = apiHost + '/';
  }
  console.log("[2] apiHost", apiHost, `${apiHost}share/${sharedHash}`);
  return `${apiHost}share/${sharedHash}`;
}

const Header = (props: { downloadLink: string }) => {
  return (
    <div className='header_container' style={{ backgroundColor: '#373d62' }}>
      <Logo />
      <div className='header_operations'>
        <a href={props.downloadLink} target="_blank">
          <Icon type='download' className='header_icon' />
        </a>
      </div>
    </div>
  );
};

function NotebookViewer(props: NotebookProps) {
  const [value, setValue] = React.useState(loadingNotebook);
  const { appPrefix, previewFile, sharable } = props;
  const getPreviewURL = () => {
    // resolve the URL from the current location
    const filesPattern = /\/share\/(.+)/;
    const sharedHash = window.location.href.match(filesPattern);
    if (sharedHash == null) {
      return null;
    }

    return toPublicDownloadLink(sharedHash[1]);
  };

  let fullPath = previewFile;
  if (!fullPath) {
    fullPath = getPreviewURL() as string;
  }

  const isSharedPage = fullPath.includes('/share/');
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
      {isSharedPage && <Header downloadLink={fullPath + '?download=1'} />}
      <NbViewer
        source={value}
        markdown={MarkdownAdapter}
        code={SyntaxHighlighter}
      />
    </div>
  );
}

export default NotebookViewer;
