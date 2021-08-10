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
    case 'REQUEST_BODY_INVALID':
      message = 'Invalidation Error';
      description = 'The requested body is not valid';
      break;

    case 'USER_CONFLICT_USERNAME':
      message = 'Conflict Error';
      description = 'User exists with same username';
      break;

    case 'USER_CONFLICT_EMAIL':
      message = 'Conflict Error';
      description = 'User exists with same email';
      break;

    case 'GROUP_CONFLICT_NAME':
      message = 'Conflict Error';
      description = 'Group exists with same name';
      break;

    case 'RESOURCE_CONFLICT':
      message = 'Conflict Error';
      description = 'Resource name already exist';
      break;

    case 'REFRESH_TOKEN_EXPIRED':
      // show notification with button
      message = 'Token Expired or Invalid';
      description = 'Please login again';
      const loginUrl = get(
        e,
        'networkError.result.errors.0.loginUrl'
      );
      // add current location to redirect_uri
      duration = 20;
      key = 'REFRESH_TOKEN_EXPIRED';
      btn = (
        // @ts-ignore
        <Button
          type="primary"
          onClick={() => window.location.replace(loginUrl)}
        >
          Login
        </Button>
      );
      break;
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
