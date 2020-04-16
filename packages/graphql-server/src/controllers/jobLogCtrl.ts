import Router from 'koa-router';
import CrdClientImpl, { client as kubeClient } from '../crdClient/crdClientImpl';
import { ParameterizedContext } from 'koa';
import { Stream } from 'stream';

const MODEL = 'model';

export class JobLogCtrl {
  private namespace: string;
  private kubeClient: any;
  private crdClient: CrdClientImpl;
  private appPrefix: string;

  constructor({
    namespace,
    crdClient,
    appPrefix
  }: {
    namespace: string,
    crdClient: CrdClientImpl,
    appPrefix?: string
  }) {
    this.namespace = namespace || 'default';
    this.kubeClient = kubeClient;
    this.crdClient = crdClient;
    this.appPrefix = appPrefix;
  }

  public streamLogs = async (ctx: ParameterizedContext) => {
    const namespace = ctx.params.namespace || this.namespace;
    const jobId = ctx.params.jobId;
    const job = await this.crdClient.imageSpecJobs.get(jobId);
    const podName = job.status.podName;
    ctx.body = this.getStream(namespace, podName);
  }

  public streamPhJobLogs = async (ctx: ParameterizedContext) => {
    const namespace = ctx.params.namespace || this.namespace;
    const jobId = ctx.params.jobId;
    const phjob = await this.crdClient.phJobs.get(jobId);
    const podName = phjob.status.podName;
    ctx.body = this.getStream(namespace, podName);
  }

  public streamPhDeploymentLogs = async (ctx: ParameterizedContext) => {
    const namespace = ctx.params.namespace || this.namespace;
    const podName = ctx.params.podName;
    ctx.body = this.getStream(namespace, podName, MODEL);
  }

  public getRoute = () => {
    return '/logs/namespaces/:namespace/jobs/:jobId';
  }

  public getPhJobRoute = () => {
    return '/logs/namespaces/:namespace/phjobs/:jobId';
  }

  public getPhDeploymentRoute = () => {
    return '/logs/namespaces/:namespace/phdeployments/:podName';
  }

  public getEndpoint = (namespace: string, jobId: string) => {
    return `${this.appPrefix || ''}/logs/namespaces/${namespace}/jobs/${jobId}`;
  }

  public getPhJobEndpoint = (namespace: string, jobId: string) => {
    return `${this.appPrefix || ''}/logs/namespaces/${namespace}/phjobs/${jobId}`;
  }

  public getPhDeploymentEndpoint = (namespace: string, podName: string) => {
    return `${this.appPrefix || ''}/logs/namespaces/${namespace}/phdeployments/${podName}`;
  }

  private getStream = (namespace: string, podName: string, container?: string): Stream => {
    return this.kubeClient.api.v1.namespaces(namespace)
      .pods(podName).log.getStream({ qs: { follow: true, container } });
  }
}

export const mount = (rootRouter: Router, middleware: any, ctrl: JobLogCtrl) => {
  rootRouter.get(ctrl.getRoute(), middleware, ctrl.streamLogs);
  rootRouter.get(ctrl.getPhJobRoute(), middleware, ctrl.streamPhJobLogs);
  rootRouter.get(ctrl.getPhDeploymentRoute(), middleware, ctrl.streamPhDeploymentLogs);
};
