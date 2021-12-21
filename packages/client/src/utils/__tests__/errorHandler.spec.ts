import { errorHandler } from '../errorHandler';
import { notification } from 'antd';
const spyNotification = jest.spyOn(notification, 'error').mockImplementation();

describe('ErrorHandler', () => {
  const placement = 'bottomRight';
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should Handler REQUEST_BODY_INVALID properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'REQUEST_BODY_INVALID',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Invalidation Error',
      description: 'The requested body is not valid',
      placement,
    });
  });

  it('Should Handler USER_CONFLICT_USERNAME properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'USER_CONFLICT_USERNAME',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Conflict Error',
      description: 'User exists with same username',
      placement,
    });
  });

  it('Should Handler USER_CONFLICT_EMAIL properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'USER_CONFLICT_EMAIL',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Conflict Error',
      description: 'User exists with same email',
      placement,
    });
  });

  it('Should Handler GROUP_CONFLICT_NAME properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'GROUP_CONFLICT_NAME',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Conflict Error',
      description: 'Group exists with same name',
      placement,
    });
  });

  it('Should Handler RESOURCE_CONFLICT properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'RESOURCE_CONFLICT',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Conflict Error',
      description: 'Resource name already exist',
      placement,
    });
  });

  it('Should Handler REFRESH_TOKEN_EXPIRED properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'REFRESH_TOKEN_EXPIRED',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Token Expired or Invalid',
      description: 'Please login again',
      placement,
    });
  });

  it('Should Handler EXCEED_QUOTA with default message properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'EXCEED_QUOTA',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Exceed Quota',
      description: 'The quota exceeded',
      placement,
    });
  });

  it('Should Handler EXCEED_QUOTA with error message properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'EXCEED_QUOTA',
          },
          message: 'test message exceed quota',
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Exceed Quota',
      description: 'test message exceed quota',
      placement,
    });
  });

  it('Should Handler INTERNAL_SERVER_ERROR with default message properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Something wrong... :(',
      description: 'Server Error',
      placement,
    });
  });

  it('Should Handler INTERNAL_SERVER_ERROR with error message properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
          },
          message: 'test internal server error',
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Something wrong... :(',
      description: 'test internal server error',
      placement,
    });
  });

  it('Should Handler NOT_AUTH with default message properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'NOT_AUTH',
          },
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Forbidden :(',
      description: 'You do not have permissions.',
      placement,
    });
  });

  it('Should Handler NOT_AUTH with error message properly', () => {
    const error = {
      graphQLErrors: [
        {
          extensions: {
            code: 'NOT_AUTH',
          },
          message: 'test internal server error',
        },
      ],
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Forbidden :(',
      description: 'test internal server error',
      placement,
    });
  });

  it('Should Handler Network Error with error message properly', () => {
    const error = {
      networkError: {
        result: {
          errors: [
            {
              extensions: {
                code: 'NOT_AUTH',
              },
              message: 'test internal server error',
            },
          ],
        },
      },
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Forbidden :(',
      description: 'test internal server error',
      placement,
    });
  });

  it('Should Handler unknown error with default message properly', () => {
    const error = {};
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Something wrong... :(',
      description: 'Server Error',
      placement,
    });
  });

  it('Should Handler unknown error with error message properly', () => {
    const error = {
      message: 'Unknown Error',
      description: 'Unknown description',
    };
    errorHandler(error);
    expect(spyNotification).toHaveBeenCalledWith({
      message: 'Unknown Error',
      description: 'Unknown description',
      placement,
    });
  });
});
