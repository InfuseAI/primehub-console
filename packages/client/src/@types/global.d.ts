export {};
declare global {
  interface Window {
    enablePhfs?: boolean;
    development: boolean;
    enableApp: boolean;
    enableLicenseCheck: boolean;
    enableModelDeployment: boolean;
    enableMaintenanceNotebook?: boolean;
    enableGrafana?: boolean;
    enableUsageReport?: boolean;
    enableCustomImage?: boolean;
    disableMode?: boolean;
    disableGroup?: boolean;
    customImageSetup?: string;
    enableUploadServer?: boolean;
    disableEnableSharedVolume?: boolean;
    isUserAdmin?: boolean;
    enableLogPersistence?: boolean;
    enableJobArtifact?: boolean;
    enableJobMonitoring?: boolean;
    enableNPSSurvey?: boolean;

    everyoneGroupId?: string;
    primehubVersion: string;
    EVERYONE_GROUP_ID: string;
    jobDefaultActiveDeadlineSeconds?: string;
    apiToken?: string;
    thumbnail?: string;
    absGraphqlEndpoint?: string;
    graphqlEndpoint?: string;
    requestApiTokenEndpoint?: string;
    LOCALE?: string;
    APP_PREFIX?: string;
    cmsHost?: string;
    refreshTokenExp?: number;
    accessTokenExp?: number;
    SS_WIDGET_TOKEN?: string;
    SS_ACCOUNT?: string;
    SS_SURVEY_NAME?: string;
    SparrowLauncher?: any;
    analytics?: any;
    enableInviteUsers?: any;
    mlflowVersion?: string;
  }
}
