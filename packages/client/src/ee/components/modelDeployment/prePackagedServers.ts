const tagMapping: Record<string, Record<string, string>> = {
  TensorFlow: { '1': 'v0.2.0', '2': 'v0.3.0' },
  PyTorch: { '1': 'v0.2.0', '2': 'v0.3.0' },
  Sklearn: { '1': 'v0.1.0', '2': 'v0.2.0' },
};

const getTag = (
  mlflowVer: string,
  serverType: 'TensorFlow' | 'PyTorch' | 'Sklearn'
) => {
  return tagMapping[serverType][mlflowVer];
};

export const PrePackagedServers = [
  {
    title: 'TensorFlow2 server',
    url: `infuseai/tensorflow2-prepackaged:${getTag(
      window.mlflowVersion,
      'TensorFlow'
    )}`,
    docLink:
      'https://docs.primehub.io/docs/model-deployment-prepackaged-server-tensorflow2',
  },
  {
    title: 'PyTorch server',
    url: `infuseai/pytorch-prepackaged:${getTag(
      window.mlflowVersion,
      'PyTorch'
    )}`,
    docLink:
      'https://docs.primehub.io/docs/model-deployment-prepackaged-server-pytorch',
  },
  {
    title: 'SKLearn server',
    url: `infuseai/sklearn-prepackaged:${getTag(
      window.mlflowVersion,
      'Sklearn'
    )}`,
    docLink:
      'https://docs.primehub.io/docs/model-deployment-prepackaged-server-sklearn',
  },
];
