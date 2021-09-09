import * as React from 'react';
import ReactDOM from 'react-dom';
import NotebookViewer from 'containers/sharedFiles/NotebookView';

const SharePage = () => {
  return (
    <div>
      <NotebookViewer />
    </div>
  );
};

ReactDOM.render(<SharePage />, document.getElementById('root'));
