import Router from 'koa-router';
import CrdClientImpl, { client as kubeClient } from '../crdClient/crdClientImpl';
import { ParameterizedContext } from 'koa';
import { Stream } from 'stream';

export class JobLogCtrl {
  private namespace: string;
  private kubeClient: any;
  private crdClient: CrdClientImpl;

  constructor({
    namespace,
    crdClient
  }: {
    namespace: string,
    crdClient: CrdClientImpl
  }) {
    this.namespace = namespace || 'default';
    this.kubeClient = kubeClient;
    this.crdClient = crdClient;
  }

  public streamLogs = async (ctx: ParameterizedContext) => {
    const namespace = ctx.params.namespace || this.namespace;
    const jobId = ctx.params.jobId;
    const job = await this.crdClient.imageSpecJobs.get(jobId);
    const podName = job.status.podName;
    ctx.body = this.getStream(namespace, podName);
  }

  private getStream = (namespace: string, podName: string): Stream => {
    return this.kubeClient.api.v1.namespaces(namespace).pods(podName).log.getStream({ qs: { follow: true } });
  }
}

export const mount = (rootRouter: Router, middleware: any, ctrl: JobLogCtrl) => {
  rootRouter.get('/logs/namespaces/:namespace/jobs/:jobId', middleware, ctrl.streamLogs);
};
