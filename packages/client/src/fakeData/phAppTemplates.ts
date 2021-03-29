export const phAppTemplates = [
  {
    id: 'mlflow',
    name: 'MLflow',
    description: 'MLflow is an open source platform to manage the ML lifecycle, including experimentation, reproducibility, deployment, and a central model registry.',
    version: 'v1.14.0',
    docLink: 'https://www.mlflow.org/docs/latest/index.html',
    icon: 'http://nolink',
    defaultEnvs: [
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
  },
  {
    id: 'matlab',
    name: 'MATLAB',
    description: 'MATLAB is a programming and numeric computing platform used by millions of engineers and scientists to analyze data, develop algorithms, and create models.',
    version: 'v7.0.1',
    docLink: 'https://www.mathworks.com/products/matlab/getting-started.html',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Matlab_Logo.png/667px-Matlab_Logo.png',
    defaultEnvs: [
    ],
  }
];

export default phAppTemplates;
