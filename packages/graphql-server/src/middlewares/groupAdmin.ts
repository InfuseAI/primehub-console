import Koa, {Context} from 'koa';
import { isGroupAdmin, isAdmin } from '../resolvers/utils';
import Boom from 'boom';
import { createConfig } from '../config';
import CrdClient from '../crdClient/crdClientImpl';

const config = createConfig();
const namespace = config.k8sCrdNamespace;
const crdClient = new CrdClient({
  namespace
});

export const groupAdminMiddleware = async (ctx: Koa.Context, next: any) => {
  const { params, username, kcAdminClient } = ctx;

  const { imageId } = params;
  if (imageId) {
    const image = await crdClient.images.get(imageId);
    const groupName = image.spec.groupName;
    if (isAdmin || await isGroupAdmin(username, groupName, kcAdminClient)) {
      return next();
    } else {
      throw Boom.forbidden('request not authorized');
    }
  }
  return false;
};

export default groupAdminMiddleware;
