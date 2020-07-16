import gql from 'graphql-tag';

export enum Phase {
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Unknown = 'Unknown',
}

export enum Status {
  Deploying = 'Deploying',
  Deployed = 'Deployed',
  Stopped = 'Stopped',
  Stopping = 'Stopping',
  Failed = 'Failed',
}

export interface DeploymentConnection {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  edges: Array<{
    cursor: string;
    node: DeploymentInfo;
  }>
}

export interface HistoryItem {
  deployment: DeploymentInfo;
  time: string;
}

export interface ClientItem {
  client: string;
}

export interface ClientResult {
  name: string;
  plainTextToken: string;
}

export interface DeploymentInfo {
  id: string;
  user: {name: string};
  status: Status;
  message: string;
  name: string;
  description: string;
  updateMessage: string;
  metadata: object;
  groupId: string;
  groupName: string;
  creationTime: string
  lastUpdatedTime: string;
  endpoint: string;
  endpointAccessType: string;
  endpointClients: Array<ClientItem>;
  modelImage: string;
  pods: Array<{
    name: string;
    logEndpoint: string;
    phase: Phase;
  }>,
  availableReplicas: number,
  replicas: number;
  imagePullSecret: string;
  instanceType: {
    id: string;
    name: string;
    displayName: string;
    cpuLimit: number;
    memoryLimit: number;
    gpuLimit: number;
  };
  history: Array<HistoryItem>;
}

export const PhDeploymentFragment = gql`
fragment PhDeploymentInfo on PhDeployment {
  id
  status
  message
  name
  description
  updateMessage
  metadata
  groupId
  groupName
  creationTime
  lastUpdatedTime
  endpoint
  endpointAccessType
  endpointClients {
    name
  }
  modelImage
  pods {
    name
    logEndpoint
  }
  availableReplicas
  replicas
  imagePullSecret
  instanceType {
    id
    name
    displayName
    cpuLimit
    memoryLimit
    gpuLimit
  }
  history {
    deployment {
      id
      userName
      stop
      modelImage
      replicas
      groupName
      description
      updateMessage
      metadata
      endpointClients {
        name
      }
      endpointAccessType
      instanceType {
        id
        name
        displayName
        cpuLimit
        memoryLimit
        gpuLimit
      }
    }
    time
  }
}
`
