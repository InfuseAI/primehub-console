export {};
declare global {
  interface Window {
    enablePhfs?: boolean;
    EVERYONE_GROUP_ID: string;
    development: boolean;
    primehubVersion: string;
    enableApp: boolean;
    enableModelDeployment: boolean;

    enableMaintenanceNotebook?: boolean;
    enableGrafana?: boolean;
    enableUsageReport?: boolean;

    LOCALE?: string;
    APP_PREFIX?: string;
    refreshTokenExp?: number;
    accessTokenExp?: number;
  }
}
