import * as React from 'react';
import ReactDOM from 'react-dom';
import { appPrefix } from 'utils/env';
import NotebookViewer from 'containers/sharedFiles/NotebookView';

const SharePage = () => {
  return (
    <div>
      <NotebookViewer appPrefix={appPrefix} />
    </div>
  );
};

ReactDOM.render(<SharePage />, document.getElementById('root'));
