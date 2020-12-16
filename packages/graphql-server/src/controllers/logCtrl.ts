import { kubeConfig, client as kubeClient } from '../crdClient/crdClientImpl';
import { ParameterizedContext } from 'koa';
import { Stream } from 'stream';
import * as logger from '../logger';
import { escapePodName } from '../utils/escapism';

export class PodLogs {

    private namespace: string;
    private kubeClient: any;

    constructor({
        namespace
    }: {
        namespace: string
    }) {
        this.namespace = namespace || ' default';
        this.kubeClient = kubeClient;
    }

    public getRoute = () => {
        return '/logs/jupyterhub';
    }

    public streamPodLogs = async (ctx: ParameterizedContext) => {
        const {follow=true, tailLines, container} = ctx.query;
        const podName = 'jupyter-' + escapePodName(ctx.username);

        let tail = 1000;
        if (tailLines) {
            tail = parseInt(tailLines, 10);
        }

        const stream: Stream = await this.kubeClient.api.v1
            .namespaces(this.namespace).pods(podName).log.getByteStream({
                qs: {
                    container: container || 'notebook',
                    tailLines: tail,
                    follow
                }
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
