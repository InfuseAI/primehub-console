import iconJupyterHub from 'images/icon-jupyterhub.svg';
import iconJobs from 'images/icon-jobs.svg';
import iconSchedule from 'images/icon-schedule.svg';
import iconModels from 'images/icon-models.svg';
import iconImages from 'images/icon-images.png';
import iconShareFiles from 'images/icon-files.svg';
import iconApps from 'images/icon-apps.svg';
import iconSettings from 'images/icon-settings.svg';

const FEATURE_CE = "CE";
const FEATURE_EE = "EE";
const FEATURE_DEPLOY = "DEPLOY";

const list = [
  {
    title: 'Notebooks',
    subPath: 'hub',
    icon: iconJupyterHub,
    enabledIn: [FEATURE_CE, FEATURE_EE],
    style: {
      width: 'auto',
      height: 22,
      marginRight: '-3px',
      marginLeft: '-2px',
      marginTop: '-2px'
    }
  },
  {
    title: 'Jobs',
    subPath: 'job',
    icon: iconJobs,
    enabledIn: [FEATURE_EE],
    style: {
      width: 'auto',
      height: 17,
      marginLeft: '1px',
      marginRight: '-1px',
      marginTop: '-3px',
    }
  },
  {
    title: 'Schedule',
    subPath: 'schedule',
    icon: iconSchedule,
    enabledIn: [FEATURE_EE],
    style: {
      width: 'auto',
      height: 15,
      marginLeft: '2px',
      marginRight: '-1px',
      marginTop: '-5px',
    }
  },
  {
    title: 'Models',
    subPath: 'models',
    icon: iconModels,
    enabledIn: [FEATURE_EE, FEATURE_DEPLOY],
    style: {
      width: 'auto',
      height: 16,
      marginLeft: '2px',
      marginRight: '-2px',
      marginTop: '-5px',
    }
  },
  {
    title: 'Deployments',
    subPath: 'deployments',
    icon: iconModels,
    enabledIn: [FEATURE_EE, FEATURE_DEPLOY],
    style: {
      width: 'auto',
      height: 16,
      marginLeft: '2px',
      marginRight: '-2px',
      marginTop: '-5px',
    }
  },
  {
    title: 'Shared Files',
    subPath: 'browse',
    icon: iconShareFiles,
    enabledIn: [FEATURE_CE, FEATURE_EE, FEATURE_DEPLOY],
    style: {
      width: 'auto',
      height: 17,
      marginLeft: '3px',
      marginRight: '-1px',
      marginTop: '-3px',
    }
  },
  {
    title: 'Apps',
    subPath: 'apps',
    icon: iconApps,
    enabledIn: [FEATURE_CE, FEATURE_EE, FEATURE_DEPLOY],
    stage: 'beta',
    hidden: !window.enableApp,
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
    enabledIn: [FEATURE_CE, FEATURE_EE],
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
    enabledIn: [FEATURE_CE, FEATURE_EE, FEATURE_DEPLOY],
    groupAdminOnly: true,
    style: {
      width: 'auto',
      height: 21,
      marginLeft: '-1px',
      marginRight: '-4px',
      marginTop: '-3px',
    }
  },
];

export const listEE = list.filter(item => item.enabledIn.includes(FEATURE_EE));
export const listCE = list.filter(item => item.enabledIn.includes(FEATURE_CE));
export const listDeploy = list.filter(item => item.enabledIn.includes(FEATURE_DEPLOY));
