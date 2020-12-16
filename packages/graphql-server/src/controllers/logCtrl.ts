import { ParameterizedContext } from 'koa';
import { Stream } from 'stream';
import * as logger from '../logger';
import { escapePodName } from '../utils/escapism';
import { getStream as getK8SLogStream } from '../utils/k8sLog';

export class PodLogs {

    private namespace: string;

    constructor({
        namespace
    }: {
        namespace: string
    }) {
        this.namespace = namespace || ' default';
    }

    public getJupyterHubRoute = () => {
        return '/logs/jupyterhub';
    }

    public streamJupyterHubLogs = async (ctx: ParameterizedContext) => {
        const {
          follow,
          tailLines,
          container
        } = ctx.query;
        const podName = 'jupyter-' + escapePodName(ctx.username);
        const stream = getK8SLogStream(this.namespace, podName, {
          container: container || 'notebook',
          follow,
          tailLines
        });
        stream.on('error', err => {
          logger.error({
            component: logger.components.internal,
            type: 'K8S_STREAM_LOG',
            message: err.message
          });

          ctx.res.end();
        });
        ctx.body = stream;
    }
}
