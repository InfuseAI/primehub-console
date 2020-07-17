import Router from 'koa-router';
import CrdClientImpl, { client as kubeClient } from '../../crdClient/crdClientImpl';
import { ParameterizedContext } from 'koa';
import { Stream, Readable } from 'stream';
import { get } from 'lodash';
import * as logger from '../../logger';
import PersistLog from '../../utils/persistLog';

const MODEL = 'model';

export class JobLogCtrl {
  private namespace: string;
  private kubeClient: any;
  private crdClient: CrdClientImpl;
  private appPrefix: string;
  private persistLog: PersistLog;

  constructor({
    namespace,
    crdClient,
    appPrefix,
    persistLog
  }: {
    namespace: string,
    crdClient: CrdClientImpl,
    appPrefix?: string,
    persistLog?: PersistLog,
  }) {
    this.namespace = namespace || 'default';
    this.kubeClient = kubeClient;
    this.crdClient = crdClient;
    this.appPrefix = appPrefix;
    this.persistLog = persistLog;
  }

  public streamLogs = async (ctx: ParameterizedContext) => {
    const {follow, tailLines} = ctx.query;
    const namespace = ctx.params.namespace || this.namespace;
    const jobId = ctx.params.jobId;
    const job = await this.crdClient.imageSpecJobs.get(jobId);
    const podName = job.status.podName;
    const stream = this.getStream(namespace, podName, {follow, tailLines});

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

  public streamPhJobLogs = async (ctx: ParameterizedContext) => {
    const {follow, tailLines, persist} = ctx.query;
    const namespace = ctx.params.namespace || this.namespace;
    const jobId = ctx.params.jobId;
    const phjob = await this.crdClient.phJobs.get(jobId, namespace);
    const podName = phjob.status.podName;

    let stream: Stream;
    if (this.persistLog && persist === 'true') {
      let tail = 0;
      if (tailLines) {
        tail = parseInt(tailLines, 10);
      }
      const prefix = `logs/phjob/${jobId}`;
      stream = await this.persistLog.getStream(prefix, {tailLines: tail});
    } else {
      stream = this.getStream(namespace, podName, {follow, tailLines});
      stream.on('error', err => {
        logger.error({
          component: logger.components.internal,
          type: 'K8S_STREAM_LOG',
          message: err.message
        });

        ctx.res.end();
      });
    }
    ctx.body = stream;
  }

  public streamPhDeploymentLogs = async (ctx: ParameterizedContext) => {
    const {follow, tailLines} = ctx.query;
    const namespace = ctx.params.namespace || this.namespace;
    const podName = ctx.params.podName;
    const stream = this.getStream(namespace, podName, {container: MODEL, follow, tailLines});
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

  private getStream = (
    namespace: string,
    podName: string,
    options?: {follow?: number, tailLines?: number, container?: string}): Stream => {
    const container = get(options, 'container');
    const follow = get(options, 'follow', true);
    const tailLines = get(options, 'tailLines');
    return this.kubeClient.api.v1.namespaces(namespace)
      .pods(podName).log.getStream({ qs: { container, follow, tailLines } });
  }
}
