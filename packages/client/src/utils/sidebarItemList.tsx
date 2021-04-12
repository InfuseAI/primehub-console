import iconJupyterHub from 'images/icon-jupyterhub.svg';
import iconJobs from 'images/icon-jobs.svg';
import iconSchedule from 'images/icon-schedule.svg';
import iconModels from 'images/icon-models.svg';
import iconImages from 'images/icon-images.png';
import iconShareFiles from 'images/icon-files.svg';
import iconApps from 'images/icon-apps.svg';
import iconSettings from 'images/icon-settings.svg';

export const listEE = [
  {
    title: 'Notebooks',
    subPath: 'hub',
    icon: iconJupyterHub,
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
    EEOnly: true,
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
    EEOnly: true,
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
    subPath: 'model-deployment',
    icon: iconModels,
    EEOnly: true,
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
    style: {
      width: 'auto',
      height: 17,
      marginLeft: '3px',
      marginRight: '-1px',
      marginTop: '-3px',
    }
  },
  {
    title: 'Images',
    subPath: 'images',
    icon: iconImages,
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
    title: 'Apps',
    subPath: 'apps',
    icon: iconApps,
    stage: 'alpha',
    hidden: !(window as any).enableApp,
    style: {
      width: 'auto',
      height: 20,
      marginRight: '-4px',
      marginTop: '-2px',
    },
  },
  {
    title: 'Settings',
    subPath: 'settings',
    icon: iconSettings,
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

export const listCE = listEE.filter(item => !item.EEOnly);
