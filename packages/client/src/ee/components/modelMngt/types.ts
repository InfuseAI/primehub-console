export type Deployment = { id: string; name: string; modelURI: string };

export type ModelVersion = {
  name: string;
  version: string;
  creationTimestamp: string;
  lastUpdatedTimestamp: string;
  deployedBy: {
    id: string;
    name: string;
  }[];
  run: {
    info: {
      runId: string;
      experimentId: string;
      status: string;
      startTime: string;
      endTime: string;
      artifactUri: string;
      lifecycleStage: string;
    };
    data: {
      params: {
        key: string;
        value: string;
      }[];
      metrics: {
        key: string;
        value: number;
        timestamp: string;
        step: string;
      }[];
      tags: {
        key: string;
        value: string;
      }[];
    };
  };
};
