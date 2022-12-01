import CrdClientImpl, { corev1KubeClient } from '../../crdClient/crdClientImpl';
import { Middleware, ParameterizedContext } from 'koa';
import { Stream } from 'stream';
import * as logger from '../../logger';
import PersistLog from '../../utils/persistLog';
import { getStream as getK8SLogStream } from '../../utils/k8sLog';
import Router from 'koa-router';
import { Role } from '../../resolvers/interface';
import Boom from 'boom';

const MODEL = 'model';

export class JobLogCtrl {
  private namespace: string;
  private crdClient: CrdClientImpl;
  private appPrefix: string;
  private persistLog: PersistLog;

  constructor({
    namespace,
    crdClient,
    appPrefix,
    persistLog,
  }: {
    namespace: string,
    crdClient: CrdClientImpl,
    appPrefix?: string,
    persistLog?: PersistLog,
  }) {
    this.namespace = namespace || 'default';
    this.crdClient = crdClient;
    this.appPrefix = appPrefix;
    this.persistLog = persistLog;
  }

  private canUserView = async (kcAdminClient, userId, groupId): Promise<boolean> => {
    const groups = await kcAdminClient.users.listGroups({
      id: userId
    });
    const groupIds = groups.map(u => u.id);
    if (groupIds.indexOf(groupId) >= 0) { return true; }
    return false;
  }

  public streamLogs = async (ctx: ParameterizedContext) => {
    const {role} = ctx;
    const {follow, tailLines}: {follow?: boolean; tailLines?: number} = ctx.query;
    const namespace = ctx.params.namespace || this.namespace;
    const jobId = ctx.params.jobId;
    if (role !== Role.ADMIN) {
      throw Boom.forbidden('request not authorized');
    }

    const job = await this.crdClient.imageSpecJobs.get(jobId);
    const podName = job.status.podName;
    const stream = getK8SLogStream(namespace, podName, {follow, tailLines});

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
    const {kcAdminClient, userId} = ctx;
    const {follow, tailLines, persist}: {follow?: boolean; tailLines?: number; persist?: string} = ctx.query;
    const namespace = ctx.params.namespace || this.namespace;
    const jobId = ctx.params.jobId;
    const phjob = await this.crdClient.phJobs.get(jobId, namespace);
    const podName = phjob.status.podName;
    const resource = await this.crdClient.phJobs.get(jobId, namespace);

    if (resource.spec.groupId === '') {
      throw Boom.notFound();
    }

    if (await this.canUserView(kcAdminClient, userId, resource.spec.groupId) === false) {
      throw Boom.forbidden('request not authorized');
    }

    let stream: Stream;
    if (this.persistLog && persist === 'true') {
      let tail = 0;
      if (tailLines) {
        tail = parseInt(tailLines.toString(), 10);
      }
      const prefix = `logs/phjob/${jobId}`;
      stream = await this.persistLog.getStream(prefix, {tailLines: tail});
    } else {
      stream = getK8SLogStream(namespace, podName, {follow, tailLines});
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
    const {kcAdminClient, userId} = ctx;
    const {follow, tailLines}: {follow?: boolean; tailLines?: number} = ctx.query;
    const namespace = ctx.params.namespace || this.namespace;
    const podName = ctx.params.podName;
    const pod = await corev1KubeClient.readNamespacedPod(podName, namespace);
    const phDeploymentName = pod.body.metadata.labels['primehub.io/phdeployment'] || '';
    if (phDeploymentName === '') { throw Boom.notFound(); }
    const resource = await this.crdClient.phDeployments.get(phDeploymentName, namespace);

    if (resource.spec.groupId === '') {
      throw Boom.notFound();
    }

    if (await this.canUserView(kcAdminClient, userId, resource.spec.groupId) === false) {
      throw Boom.forbidden('request not authorized');
    }

    const stream = getK8SLogStream(namespace, podName, {container: MODEL, follow, tailLines});
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

  public mount(rootRouter: Router, authenticateMiddleware: Middleware) {
    rootRouter.get(this.getRoute() as string, authenticateMiddleware, this.streamLogs);
    rootRouter.get(this.getPhJobRoute(), authenticateMiddleware, this.streamPhJobLogs);
    rootRouter.get(this.getPhDeploymentRoute(), authenticateMiddleware, this.streamPhDeploymentLogs);
  }
}
