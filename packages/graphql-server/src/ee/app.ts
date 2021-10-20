import Koa, {Context, Middleware} from 'koa';
import Router from 'koa-router';
import request from 'request';
import { schema } from './resolvers';
import { JobLogCtrl } from './controllers/jobLogCtrl';
import { PhJobCacheList } from './crdClient/phJobCacheList';
import JobArtifactCleaner from './utils/jobArtifactCleaner';
import Boom from 'boom';
import * as logger from '../logger';
import { Role } from '../resolvers/interface';
import PersistLog from '../utils/persistLog';
import { Telemetry } from '../utils/telemetry';
import { createDefaultTraitMiddleware } from '../utils/telemetryTraits';
import { createEETraitMiddleware } from './utils/telemetryTraits';
import { App as AppCE } from '../app';
import { client as kubeClient, kubeConfig } from '../crdClient/crdClientImpl';

export class AppEE extends AppCE {
  persistLog: PersistLog;
  jobLogCtrl: JobLogCtrl;
  phJobCacheList: PhJobCacheList;

  async createComponents() {
    await super.createComponents();
    const config = this.config;

    // log
    let persistLog: PersistLog;
    if (config.enableStore && config.enableLogPersistence) {
      persistLog = new PersistLog({
        bucket: this.storeBucket,
        minioClient: this.mClient
      });
    }
    this.persistLog = persistLog;

    this.jobLogCtrl = new JobLogCtrl({
      namespace: config.k8sCrdNamespace,
      crdClient: this.crdClient,
      appPrefix: config.appPrefix,
      persistLog,
    });

    // job artifact cleaner
    if (config.enableStore) {
      const jobArtifactCleaner = new JobArtifactCleaner(this.mClient, this.storeBucket);
      jobArtifactCleaner.start();
    }

    // phJob
    this.phJobCacheList = new PhJobCacheList(config.k8sCrdNamespace);
  }

  async createTelemetry() {
    const config = this.config;
    let telemetry;
    if (config.enableTelemetry) {
      telemetry = new Telemetry(config.keycloakClientSecret);
      const middleware = createDefaultTraitMiddleware({
        config,
        createKcAdminClient: this.createKcAdminClient,
        getAccessToken: () => this.tokenSyncer.getAccessToken(),
        crdClient: this.crdClient,
      });
      const eeMiddleware = createEETraitMiddleware({
        config,
        createKcAdminClient: this.createKcAdminClient,
        getAccessToken: () => this.tokenSyncer.getAccessToken(),
        crdClient: this.crdClient,
      });
      telemetry.addTraitMiddleware(middleware, eeMiddleware);
      telemetry.start();
    }
  }

  onCreateSchema() {
    return schema;
  }

  async onContext({ ctx }: { ctx: Koa.Context }) {
    const context = await super.onContext({ctx});
    return {
      ...context,
      appPrefix: this.config.appPrefix,
      jobLogCtrl: this.jobLogCtrl,
      phJobCacheList: this.phJobCacheList,
      usageReportAPIHost: this.config.usageReportAPIHost,
    };
  }

  checkIsAdmin = async (ctx: Koa.ParameterizedContext, next: any) => {
    if (ctx.role === Role.ADMIN) {
      return next();
    }
    throw Boom.forbidden('request not authorized');
  }

  checkUserGroup = async (ctx: Koa.ParameterizedContext, next: any) => {
    const config = this.config;
    const canUserView = async (userId, groupId): Promise<boolean> => {
      const groups = await ctx.kcAdminClient.users.listGroups({
        id: userId
      });
      const groupIds = groups.map(u => u.id);
      if (groupIds.indexOf(groupId) >= 0) { return true; }
      return false;
    };

    if (ctx.request.path.match(`${config.appPrefix || ''}/logs/pods/[^/]+`)) {
      return next();
    }

    const namespace = ctx.params.namespace;
    const jobId = ctx.params.jobId || '';
    let resource;
    if (jobId !== '')  {
      // PhJob
      resource = await this.crdClient.phJobs.get(jobId, namespace);
    } else {
      // PhDeployment
      const podName = ctx.params.podName;
      const pod = await kubeClient.api.v1.namespace(namespace).pods(podName).get();
      const phDeploymentName = pod.body.metadata.labels['primehub.io/phdeployment'] || '';
      if (phDeploymentName === '') { throw Boom.notFound(); }
      resource = await this.crdClient.phDeployments.get(phDeploymentName, namespace);
    }

    if (resource.spec.groupId === '') {
      throw Boom.notFound();
    }

    if (await canUserView(ctx.userId, resource.spec.groupId) === false) {
      throw Boom.forbidden('request not authorized');
    }

    return next();
  }

   /**
    * @override
    */
  mountControllers(rootRouter: Router) {
    super.mountControllers(rootRouter);
    const config = this.config;

    // Log Ctrl
    rootRouter.get(this.jobLogCtrl.getRoute() as string, this.authenticateMiddleware as Middleware, this.checkIsAdmin, this.jobLogCtrl.streamLogs);
    rootRouter.get(this.jobLogCtrl.getPhJobRoute(), this.authenticateMiddleware as Middleware, this.checkUserGroup, this.jobLogCtrl.streamPhJobLogs);
    rootRouter.get(this.jobLogCtrl.getPhDeploymentRoute(), this.authenticateMiddleware as Middleware, this.checkUserGroup, this.jobLogCtrl.streamPhDeploymentLogs);

    // usage report
    this.configureUsageReport(rootRouter,
      config.usageReportAPIHost, '/report/monthly', this.authenticateMiddleware, this.checkIsAdmin);
    this.configureUsageReport(rootRouter,
      config.usageReportAPIHost, '/report/monthly/details', this.authenticateMiddleware, this.checkIsAdmin);
  }

  configureUsageReport = (rootRouter: Router, host: string, uriPrefix: string, authenticateMiddleware: any, checkIsAdmin: any) => {
    rootRouter.get(uriPrefix + '/:year/:month', authenticateMiddleware, checkIsAdmin,
      async ctx => {
        const requestOptions: request.Options = {
          method: 'GET',
          uri: host + uriPrefix + '/' + ctx.params.year + '/' + ctx.params.month,
        };
        kubeConfig.applyToRequest(requestOptions);
        const req = request(requestOptions);

        req.on('error', err => {
          logger.error({
            component: logger.components.internal,
            type: 'USAGE_REPORT_GET_REPORT_ERROR',
            message: err.message
          });
          ctx.res.end();
        });

        ctx.body = req;
      }
    );
  }
}
