export const phApplications = [
  {
    id: 'app-0001',
    displayName: 'My MLFlow',
    appName: 'mlflow',
    appVersion: 'v1.9.0',
    appIcon: 'https://avatars.githubusercontent.com/u/39938107?s=400&v=4',
    appTemplate: {
      name: 'MLfow',
      docLink: 'https://www.mlflow.org/docs/latest/index.html',
      description: 'MLflow is an open source platform to manage the ML lifecycle, including experimentation, reproducibility, deployment, and a central model registry.',
    },
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
    instanceType: 'g-it1',
    instanceTypeSpec: {
      displayName: 'group1 it',
      description: 'Basic instance.',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    scope: 'public',
    appUrl: 'https://endpoint/modedeployment/example/test/1',
    internalAppUrl: 'app-mlflow-0001:5000/',
    svcEndpoints: [
      'app-mlflow-0001:5000/',
      'app-mlflow-0002:5000/'
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
