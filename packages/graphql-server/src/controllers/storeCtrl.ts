import Koa, {Context, Middleware} from 'koa';
import Router = require('koa-router');
import {Client} from 'minio';
import mime from 'mime';

import * as logger from '../logger';
import { Stream } from 'stream';
import getStream from 'get-stream';
import { last } from 'lodash';

export const mountStoreCtrl = (router: Router,
                               authenticateMiddleware: Middleware,
                               checkUserGroup: Middleware,
                               minioClient: Client,
                               storeBucket: string) => {
  const downloadFile = async (ctx, path, opts?: {filename: string}) => {
    let download = false;
    if ('download' in ctx.request.query && ctx.request.query.download === '1') {
      download = true;
    }

    let req;
    try {
      req = await minioClient.getObject(storeBucket, path);
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

    const mimetype = mime.getType(path);
    ctx.set('Content-type', mimetype);
    if (download) {
      if (opts?.filename) {
        ctx.set('Content-Disposition', `attachment; filename="${opts?.filename}"`);
      } else {
        ctx.set('Content-Disposition', 'attachment');
      }
    }
  };

  router.get('/files/(.*)', authenticateMiddleware, checkUserGroup, async ctx => {
    const objectPath = decodeURIComponent(ctx.request.path.split('/groups').pop());
    const path = `groups${objectPath}`;
    await downloadFile(ctx, path);
  });

  router.get('/share/:hash', async ctx => {
    const hash = ctx.params.hash;
    let metadata;
    try {
      const stream: Stream = await minioClient.getObject(storeBucket, `share/${hash}`);
      const result = await getStream(stream);
      metadata = JSON.parse(result);
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
        return ctx.status = 500;
      }
    }

    const { path } = metadata;
    if (!path) {
      return ctx.status = 500;
    }

    const filename: string = last(path.split('/'));
    await downloadFile(ctx, path, {filename});
  });
};
