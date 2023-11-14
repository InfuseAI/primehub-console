import { Context, Next } from 'koa';
import { createConfig } from './config';
import md5 from 'md5';

const createEnvVariablesSetup = () => (ctx: Context, next: Next) => {
  const config = createConfig();

  ctx.state.locale = config.locale;
  ctx.state.cmsHost = config.cmsHost;
  ctx.state.graphqlPrefix = config.graphqlPrefix;
  ctx.state.graphqlEndpoint = config.graphqlEndpoint;
  ctx.state.requestApiTokenEndpoint = config.appPrefix
    ? `${config.appPrefix}/oidc/request-api-token`
    : '/oidc/request-api-token';
  ctx.state.disableMode = config.readOnlyOnInstanceTypeAndImage;
  ctx.state.enableDatasetUpload = config.enableDatasetUpload;
  ctx.state.enableMaintenanceNotebook = config.enableMaintenanceNotebook;
  ctx.state.enableGrafana = config.enableGrafana;
  ctx.state.enableUsageReport = config.enableUsageReport;
  ctx.state.customImageSetup = config.customImageSetup;
  ctx.state.enableLicenseCheck = config.enableLicenseCheck;
  ctx.state.enableModelDeployment = config.enableModelDeployment;
  ctx.state.enableLogPersistence = config.enableLogPersistence;
  ctx.state.enablePhfs = config.enablePhfs;
  ctx.state.enableJobArtifact = config.enableJobArtifact;
  ctx.state.enableJobMonitoring = config.enableJobMonitoring;
  ctx.state.enableApp = config.enableApp;
  ctx.state.disableGroup = config.enableLicenseCheck
    ? config.licenseStatus !== 'unexpired'
    : false;
  ctx.state.everyoneGroupId = config.keycloakEveryoneGroupId;
  ctx.state.jobDefaultActiveDeadlineSeconds =
    config.jobDefaultActiveDeadlineSeconds;
  ctx.state.primehubVersion = config.primehubVersion;
  ctx.state.isUserAdmin = config.isUserAdmin;
  ctx.state.newAccessToken = config.newAccessToken;
  ctx.state.apiToken = '';
  ctx.state.apiTokenExhangeCode = '';

  ctx.state.enableTelemetry = config.enableTelemetry;
  ctx.state.enableNPSSurvey = config.enableNPSSurvey;
  ctx.state.primehubAnonymousId = md5(config.keycloakClientSecret);

  ctx.state.enableInviteUsers = config.enableInviteUsers;

  // referrer
  const referrer = `${config.cmsHost}${ctx.path}`;
  ctx.state.links = JSON.stringify({
    userProfileLink: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/account?referrer=${config.keycloakClientId}&referrer_uri=${referrer}`,
    changePasswordLink: `${config.keycloakOidcBaseUrl}/realms/${config.keycloakRealmName}/account/password?referrer=${config.keycloakClientId}&referrer_uri=${referrer}`,
    adminPortalLink: config.appPrefix ? `${config.appPrefix}/admin` : '/admin',
    logoutLink: config.appPrefix
      ? `${config.appPrefix}/oidc/logout`
      : '/oidc/logout',
  });

  return next();
};

export default createEnvVariablesSetup;
