import Boom from 'boom';
import { get } from 'lodash';

const API_UNAVAILABLE = 'API_UNAVAILABLE';

export const apiUnavailable = () => {
  return Boom.internal(API_UNAVAILABLE, {code: API_UNAVAILABLE});
};

export const isErrorApiUnavailable = (error: any) => {
  return get(error, 'exception.data.code') === API_UNAVAILABLE;
};
