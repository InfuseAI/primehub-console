import Koa, {Context} from 'koa';
import { isGroupAdmin } from '../resolvers/utils';
import Boom from 'boom';
import { createConfig } from '../config';
import CrdClient from '../crdClient/crdClientImpl';

const config = createConfig();
const namespace = config.k8sCrdNamespace;
const crdClient = new CrdClient({
  namespace
});

export const groupAdminMiddleware = async (ctx: Koa.ParameterizedContext, next: any) => {
  const { params, username } = ctx;

  const { imageId } = params;
  if (imageId) {
    const image = await crdClient.images.get(imageId);
    const groupName = image.spec.groupName;
    if (await isGroupAdmin(username, groupName, ctx)) {
      return next();
    } else {
      throw Boom.forbidden('request not authorized');
    }
  }
  return false;
};

export default groupAdminMiddleware;
