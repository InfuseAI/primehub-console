import { Context, Middleware, ParameterizedContext } from 'koa';
import Router from 'koa-router';
import { Client } from 'minio';
import { isEmpty } from 'lodash';

export const getCopyStatusEndpoint = (sessionId: string) => {
  return `/copy-status?sessionId=${sessionId}`;
}

export const mountCopyStatusCtrl = (router: Router,
                                    appPrefix: string,
                                    authenticateMiddleware: Middleware,
                                    minioClient: Client,
                                    storeBucket: string) => {

  router.get('/copy-status', authenticateMiddleware, async (ctx: ParameterizedContext) => {
    const { sessionId } = ctx.query;

    if (isEmpty(sessionId)) {
      ctx.body = { error: 'sessoinId is required' };
      return ctx.status = 200;
    }

    const sessionFilePath = `.sessions/copy-status/${sessionId}`;
    try {
      await minioClient.statObject(storeBucket, sessionFilePath);
    } catch (err) {
      ctx.body = { error: 'sessionId not found' };
      return ctx.status = 200;
    }

    const object = new Promise((resolve, reject) => {
      const arr = [];
      minioClient.getObject(storeBucket, sessionFilePath, (err, stream) => {
        if (err) {
          return reject(err);
        }
        stream.on('data', chunk => {
          arr.push(chunk);
        });
        stream.on('error', error => {
          reject(error);
        });
        stream.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(arr).toString()));
          } catch (error) {
            reject(error);
          }
        });
      });
    });

    const ret: any = await object;
    if (ret.status && ret.status === 'completed') {
      setTimeout(() => {
        minioClient.removeObject(storeBucket, sessionFilePath);
      }, 10 * 1000);
    }

    ctx.body = ret;
    return ctx.status = 200;
  });
};
