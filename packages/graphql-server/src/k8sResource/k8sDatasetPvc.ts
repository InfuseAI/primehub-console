import { client as kubeClient } from '../crdClient/crdClientImpl';
import { get, isEmpty, isUndefined, isNull } from 'lodash';
import { ApolloError } from 'apollo-server';

// utils
const stringifyVolumeSize = (volumeSize: number) => `${volumeSize}Gi`;
const parseVolumeSize = (volumeSizeFromK8s: string) => parseFloat(volumeSizeFromK8s.replace('Gi', ''));

export const getPvcName = (datasetName: string) => {
  return `dataset-${datasetName}`;
};

export default class K8sDatasetPvc {
  private namespace: string;
  private resource: any;
  private primehubGroupSc: string;

  constructor({
    namespace,
    primehubGroupSc
  }: {
    namespace: string,
    primehubGroupSc: string
  }) {
    this.namespace = namespace || 'default';
    this.primehubGroupSc = primehubGroupSc;
    this.resource = kubeClient.api.v1.namespaces(this.namespace).persistentvolumeclaims;
  }

  public findOne = async (datasetName: string) => {
    try {
      const name = getPvcName(datasetName);
      const {body} = await this.resource(name).get();
      return this.propsMapping(body);
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    }
  }

  public create = async ({
    datasetName,
    volumeSize
  }: {
    datasetName: string,
    volumeSize: number
  }) => {
    try {
      const pvcName = getPvcName(datasetName);
      const {body} = await this.resource.post({
        body: {
          Kind: 'PersistentVolumeClaim',
          apiVersion: 'v1',
          metadata: {
            name: pvcName,
            annotations: {
              'primehub-group': pvcName,
              'primehub-group-sc': this.primehubGroupSc
            }
          },
          spec: {
            accessModes: ['ReadWriteMany'],
            dataSource: null,
            resources: {
              requests: {
                storage: stringifyVolumeSize(volumeSize)
              }
            },
            selector: {
              matchLabels: {
                'primehub-group': pvcName,
                'primehub-namespace': this.namespace
              }
            },
            storageClassName: ''
          }
        }
      });
      return this.propsMapping(body);
    } catch (e) {
      if (e.statusCode === 409) {
        throw new ApolloError(e.message, 'RESOURCE_CONFLICT');
      }
      throw e;
    }
  }

  public async delete(datasetName: string) {
    try {
      await this.resource(getPvcName(datasetName)).delete();
    } catch (err) {
      if (err.statusCode === 404) {
        return;
      }
      throw err;
    }
  }

  private propsMapping = (response: any) => {
    // filter out secret
    const name = get(response, 'metadata.name');
    const originVolumeSize = get(response, 'spec.resources.requests.storage');
    const volumeSize = originVolumeSize ? parseVolumeSize(originVolumeSize) : null;

    return {
      name,
      volumeSize
    };
  }
}
