import iconHome from 'images/icon-home.svg';
import iconJupyterHub from 'images/icon-jupyterhub.svg';
import iconJobs from 'images/icon-jobs.svg';
import iconSchedule from 'images/icon-schedule.svg';
import iconModels from 'images/icon-models.svg';
import iconDeployments from 'images/icon-deployments.svg';
import iconImages from 'images/icon-images.png';
import iconShareFiles from 'images/icon-files.svg';
import iconApps from 'images/icon-apps.svg';
import iconSettings from 'images/icon-settings.svg';

export const FEATURES = {
  CE: 'CE',
  EE: 'EE',
  DEPLOY: 'DEPLOY',
} as const;

export const PATH_KEY_LIST = [
  'home',
  'hub',
  'job',
  'schedule',
  'models',
  'deployments',
  'browse',
  'datasets',
  'images',
  'apps',
  'settings',
] as const;

export type SidebarPathList = typeof PATH_KEY_LIST[number];
export type Feature = keyof typeof FEATURES;
export interface SidebarItem {
  title: string;
  subPath: SidebarPathList;
  icon: string;
  enabledIn: Feature[];
  proFeature?: boolean;
  style?: React.CSSProperties;
  stage?: string;
  groupAdminOnly?: boolean;
}
export type SidebarList = SidebarItem[];

export const sidebarList: SidebarList = [
  {
    title: 'Home',
    subPath: 'home',
    icon: iconHome,
    enabledIn: [FEATURES.CE, FEATURES.EE, FEATURES.DEPLOY],
    style: {
      width: 'auto',
      height: 16,
      marginTop: '-4px',
    },
  },
  {
    title: 'Notebooks',
    subPath: 'hub',
    icon: iconJupyterHub,
    enabledIn: [FEATURES.CE, FEATURES.EE],
    style: {
      width: 'auto',
      height: 22,
      marginRight: '-3px',
      marginLeft: '-2px',
      marginTop: '-2px',
    },
  },
  {
    title: 'Jobs',
    subPath: 'job',
    icon: iconJobs,
    enabledIn: [FEATURES.EE],
    style: {
      width: 'auto',
      height: 17,
      marginLeft: '1px',
      marginRight: '-1px',
      marginTop: '-3px',
    },
  },
  {
    title: 'Schedule',
    subPath: 'schedule',
    icon: iconSchedule,
    enabledIn: [FEATURES.EE],
    style: {
      width: 'auto',
      height: 15,
      marginLeft: '2px',
      marginRight: '-1px',
      marginTop: '-5px',
    },
  },
  {
    title: 'Models',
    subPath: 'models',
    icon: iconModels,
    enabledIn: [FEATURES.EE, FEATURES.DEPLOY],
    stage: 'beta',
    style: {
      width: 'auto',
      height: 18,
      marginLeft: '1px',
      marginRight: '-2px',
      marginTop: '-3px',
    },
  },
  {
    title: 'Deployments',
    subPath: 'deployments',
    icon: iconDeployments,
    enabledIn: [FEATURES.EE, FEATURES.DEPLOY],
    style: {
      width: 'auto',
      height: 16,
      marginLeft: '2px',
      marginRight: '-2px',
      marginTop: '-5px',
    },
  },
  {
    title: 'Shared Files',
    subPath: 'browse',
    icon: iconShareFiles,
    enabledIn: [FEATURES.CE, FEATURES.EE, FEATURES.DEPLOY],
    style: {
      width: 'auto',
      height: 17,
      marginLeft: '3px',
      marginRight: '-1px',
      marginTop: '-3px',
    },
  },
  {
    title: 'Datasets',
    subPath: 'datasets',
    // TODO: change icon
    icon: iconShareFiles,
    enabledIn: [FEATURES.CE, FEATURES.EE, FEATURES.DEPLOY],
    style: {
      width: 'auto',
      height: 17,
      marginLeft: '3px',
      marginRight: '-1px',
      marginTop: '-3px',
    },
  },
  {
    title: 'Apps',
    subPath: 'apps',
    icon: iconApps,
    enabledIn: [FEATURES.CE, FEATURES.EE],
    style: {
      width: 'auto',
      height: 20,
      marginRight: '-4px',
      marginTop: '-2px',
    },
  },
  {
    title: 'Images',
    subPath: 'images',
    icon: iconImages,
    enabledIn: [FEATURES.CE, FEATURES.EE],
    groupAdminOnly: true,
    style: {
      width: 'auto',
      height: 17,
      marginLeft: '1px',
      marginRight: '-1px',
      marginTop: '-3px',
    },
  },
  {
    title: 'Settings',
    subPath: 'settings',
    icon: iconSettings,
    enabledIn: [FEATURES.CE, FEATURES.EE, FEATURES.DEPLOY],
    groupAdminOnly: true,
    style: {
      width: 'auto',
      height: 21,
      marginLeft: '-1px',
      marginRight: '-4px',
      marginTop: '-3px',
    },
  },
];

export const listEE = sidebarList.filter(item =>
  item.enabledIn.includes(FEATURES.EE)
);

export const listCE = sidebarList
  .filter(
    item =>
      item.enabledIn.includes(FEATURES.CE) ||
      item.enabledIn.includes(FEATURES.EE)
  )
  .map(item => {
    if (
      item.enabledIn.includes(FEATURES.EE) &&
      !item.enabledIn.includes(FEATURES.CE)
    ) {
      return {
        ...item,
        proFeature: true,
      };
    }
    return item;
  });

export const listDeploy = sidebarList.filter(item =>
  item.enabledIn.includes(FEATURES.DEPLOY)
);
