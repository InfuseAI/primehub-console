import Koa from 'koa';
import Router from 'koa-router';
import { schema } from './resolvers';
import { JobLogCtrl } from './controllers/jobLogCtrl';
import { PhJobCacheList } from './crdClient/phJobCacheList';
import JobArtifactCleaner from './utils/jobArtifactCleaner';
import PersistLog from '../utils/persistLog';
import { Telemetry } from '../utils/telemetry';
import { createDefaultTraitMiddleware } from '../utils/telemetryTraits';
import { createEETraitMiddleware } from './utils/telemetryTraits';
import { App as AppCE } from '../app';
import { mountUsageCtrl, } from './controllers/usageCtrl';

export class AppEE extends AppCE {
  persistLog: PersistLog;
  jobLogCtrl: JobLogCtrl;
  phJobCacheList: PhJobCacheList;

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
  onCreateSchema() {
    return schema;
  }

  /**
   * @override
   */
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

   /**
    * @override
    */
  mountControllers(rootRouter: Router) {
    super.mountControllers(rootRouter);
    const config = this.config;

    // Log Ctrl
    this.jobLogCtrl.mount(rootRouter, this.authenticateMiddleware);

    // usage report
    mountUsageCtrl(rootRouter, config.usageReportAPIHost, this.authenticateMiddleware);
  }
}
