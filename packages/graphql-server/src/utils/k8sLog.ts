import request from 'request';
import { kubeConfig } from '../crdClient/crdClientImpl';
import { Stream } from 'stream';

export const getStream = (
  namespace: string,
  podName: string,
  options?: {follow?: boolean, tailLines?: number, container?: string}): Stream => {

  // Use the 'kubernetes@client-nodes' Log API to tail the log.
  // Ref: https://github.com/kubernetes-client/javascript/blob/0.11.1/src/log.ts
  const path = `/api/v1/namespaces/${namespace}/pods/${podName}/log`;

  const cluster = kubeConfig.getCurrentCluster();
  if (!cluster) {
      throw new Error('No currently active cluster');
  }
  const url = cluster.server + path;

  const requestOptions: request.Options = {
      method: 'GET',
      qs: options,
      uri: url,
  };

  kubeConfig.applyToRequest(requestOptions);

  return request(requestOptions);
};
