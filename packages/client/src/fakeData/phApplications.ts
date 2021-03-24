export const phApplications = [
  {
    id: 'app-0001',
    displayName: 'My MLFlow',
    appName: 'mlflow',
    appVersion: 'v1.9.0',
    appIcon: 'https://avatars.githubusercontent.com/u/39938107?s=400&v=4',
    appDefaultEnv: [
      {
        name: 'BACKEND_STORE_URI',
        description: '',
        defaultValue: 'sqlite://$(PRIMEHUB_APP_ROOT)/mlflow.db',
        optional: false
      },
      {
        name: 'DEFAULT_ARTIFACT_ROOT',
        description: '',
        defaultValue: '$(PRIMEHUB_APP_ROOT)/mlruns',
        optional: false
      }
    ],
    groupName: 'Group1',
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    scope: 'public',
    appUrl: 'https://endpoint/modedeployment/example/test/1',
    internalAppUrl: 'app-mlflow-0001:5000/',
    svcEndpoint: [
      'app-mlflow-0001:5000/'
    ],
    env: [
      {
        name: 'BACKEND_STORE_URI',
        value: 'sqlite://$(PRIMEHUB_APP_ROOT)/mlflow.db'
      },
      {
        name: 'DEFAULT_ARTIFACT_ROOT',
        value: '$(PRIMEHUB_APP_ROOT)/mlruns'
      }
    ],
    stop: false,
    status: 'Ready',
    message: `batch1 batch2 batch3 batch4 `,
  }
];

export default phApplications;
