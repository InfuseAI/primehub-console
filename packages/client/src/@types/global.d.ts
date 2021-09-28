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
    customImageSetup?: boolean;
    enableUploadServer?: boolean;
    disableEnableSharedVolume?: boolean;
    isUserAdmin?: boolean;
    enableLogPersistence?: boolean;
    enableJobArtifact?: boolean;
    enableJobMonitoring?: boolean;

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
  }
}
