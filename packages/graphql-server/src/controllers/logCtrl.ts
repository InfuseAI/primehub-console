import { ParameterizedContext } from 'koa';
import * as logger from '../logger';
import { escapePodName } from '../utils/escapism';
import { getStream as getK8SLogStream } from '../utils/k8sLog';
import CrdClientImpl, { client as kubeClient } from '../crdClient/crdClientImpl';

export class PodLogs {

  private namespace: string;
  private appPrefix: string;
  private crdClient: CrdClientImpl;

  constructor({
    namespace,
    crdClient,
    appPrefix
  }: {
    namespace: string,
    crdClient?: CrdClientImpl,
    appPrefix?: string
  }) {
    this.namespace = namespace || 'default';
    this.crdClient = crdClient || new CrdClientImpl({ namespace });
    this.appPrefix = appPrefix || '';
  }

  public jupyterHubRoute = '/logs/jupyterhub';
  public imageSpecJobRoute = '/logs/images/:imageId/job';

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

  public getImageSpecJobEndpoint = (imageId: string) => {
    return `${this.appPrefix || ''}/logs/images/${imageId}/job`;
  }

  public streamImageSpecJobLogs = async (ctx: ParameterizedContext) => {
    const {follow, tailLines} = ctx.query;
    const imageId = ctx.params.imageId;
    const imageSpecJob = await this.crdClient.imageSpecJobs.get(imageId);
    const podName = imageSpecJob.status.podName;
    const stream = getK8SLogStream(this.namespace, podName, {follow, tailLines});

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
