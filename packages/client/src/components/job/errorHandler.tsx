import {get} from 'lodash';
import {notification} from 'antd';

export function errorHandler (e) {
  // get the first error
  let errorCode;
  let message;
  let description;
  // from networkError
  if (e.networkError) {
    errorCode = get(e, 'networkError.result.errors.0.extensions.code');
  } else {
    // from graphQLErrors
    errorCode = get(e, 'graphQLErrors.0.extensions.code');
  }
  switch (errorCode) {
    case 'EXCEED_QUOTA':
      message = 'Runtime Error';
      description = 'The quota exceeded';
      break;
  };
  notification.error({
    message,
    description,
    placement: 'bottomRight'
  });
}