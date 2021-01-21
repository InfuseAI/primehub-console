import Koa, {Context, Middleware} from 'koa';
import Router = require('koa-router');
import {Client} from 'minio';
import mime from 'mime';

import * as logger from '../logger';

export const mountStoreCtrl = (router: Router, authenticateMiddleware: Middleware, checkUserGroup: Middleware, minioClient: Client, storeBucket: string) => {
  router.get('/files/(.*)', authenticateMiddleware, checkUserGroup,
    async ctx => {
      const objectPath = decodeURIComponent(ctx.request.path.split('/groups').pop());
      let download = false;
      if ('download' in ctx.request.query && ctx.request.query['download'] === '1') {
        download = true;
      }
      let req;
      try {
        req = await minioClient.getObject(storeBucket, `groups${objectPath}`);
      } catch (error) {
        if (error.code === 'NoSuchKey') {
          return ctx.status = 404;
        } else {
          logger.error({
            component: logger.components.internal,
            type: 'MINIO_GET_OBJECT_ERROR',
            code: error.code,
            message: error.message
          });
          ctx.res.end();
        }
      }

      req.on('error', err => {
        logger.error({
          component: logger.components.internal,
          type: 'MINIO_GET_OBJECT_ERROR',
          message: err.message
        });
        ctx.res.end();
      });

      ctx.body = req;

      const mimetype = mime.getType(objectPath);
      ctx.set('Content-type', mimetype);
      if (download) {
        ctx.set('Content-Disposition', 'attachment');
      }
    }
  );
};