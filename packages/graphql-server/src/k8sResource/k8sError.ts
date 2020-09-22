import Boom from 'boom';
import { get } from 'lodash';

const API_UNAVAILABLE = 'API_UNAVAILABLE';
const RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND';

export const apiUnavailable = () => {
  return Boom.internal(API_UNAVAILABLE, {code: API_UNAVAILABLE});
};

export const resourceNotFound = (err: Error) => {
  return Boom.badRequest(err.message, {code: RESOURCE_NOT_FOUND});
};

export const isErrorApiUnavailable = (error: any) => {
  return get(error, 'exception.data.code') === API_UNAVAILABLE;
};
