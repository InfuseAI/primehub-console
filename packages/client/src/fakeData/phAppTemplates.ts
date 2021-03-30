export const phAppTemplates = [
  {
    id: 'mlflow',
    name: 'MLflow',
    description: 'MLflow is an open source platform to manage the ML lifecycle, including experimentation, reproducibility, deployment, and a central model registry.',
    version: 'v1.9.1',
    docLink: 'https://www.mlflow.org/docs/latest/index.html',
    icon: 'https://avatars.githubusercontent.com/u/39938107?s=400&v=4',
    template: {
      "spec": {
        "httpPort": 5000,
        "podTemplate": {
          "spec": {
            "containers": [
              {
                "args": [
                  "server",
                  "--host",
                  "0.0.0.0",
                  "--default-artifact-root",
                  "$(DEFAULT_ARTIFACT_ROOT)",
                  "--backend-store-uri",
                  "$(BACKEND_STORE_URI)"
                ],
                "command": [
                  "mlflow"
                ],
                "env": [
                  {
                    "name": "FOO",
                    "value": "bar"
                  }
                ],
                "image": "larribas/mlflow:1.9.1",
                "name": "mlflow",
                "ports": [
                  {
                    "containerPort": 5000,
                    "name": "http",
                    "protocol": "TCP"
                  }
                ]
              }
            ]
          }
        },
        "svcTemplate": {
          "spec": {
            "ports": [
              {
                "name": "http",
                "port": 5000,
                "protocol": "TCP",
                "targetPort": 5000
              }
            ]
          }
        }
      }
    },
    defaultEnvs: [
      {
        name: 'BACKEND_STORE_URI',
        description: 'Back store uri',
        defaultValue: 'sqlite://$(PRIMEHUB_APP_ROOT)/mlflow.db',
        optional: false
      },
      {
        name: 'DEFAULT_ARTIFACT_ROOT',
        description: 'Default artifact path',
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
