import { Context } from '../resolvers/interface';
import { get } from 'lodash';
import Boom from 'boom';
import { ErrorCodes } from '../errorCodes';

const readOnlyMiddleware = async (resolve, root, args, context: Context, info) => {
  const operationType = get(info, 'operation.operation');
  if (!context.readOnly || (context.readOnly && operationType === 'query')) {
    return resolve(root, args, context, info);
  }

  // readOnly true, but operation is one of mutation or subscription
  throw Boom.forbidden('Only query allowed in readonly request', {code: ErrorCodes.MUTATION_IN_READONLY});
};

export default readOnlyMiddleware;
