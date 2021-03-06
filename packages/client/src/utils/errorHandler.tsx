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
    description =  get(e, 'networkError.result.errors.0.message');
  } else {
    // from graphQLErrors
    errorCode = get(e, 'graphQLErrors.0.extensions.code');
    description =  get(e, 'graphQLErrors.0.message');
  }

  switch (errorCode) {
    case 'EXCEED_QUOTA':
      message = 'System Error';
      description = description || 'The quota exceeded';
      break;
    case 'INTERNAL_SERVER_ERROR':
      message = 'Something wrong... :(';
      description = description || 'Server Error';
      break;
    case 'NOT_AUTH':
      message = 'Forbidden :(';
      description = description || 'You do not have permissions.';
      break;
    default:
      message = 'Something wrong... :(';
      description = description || 'Server Error';
  };

  notification.error({
    message,
    description,
    placement: 'bottomRight'
  });
}
