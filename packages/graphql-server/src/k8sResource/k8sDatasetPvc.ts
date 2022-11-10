import { corev1KubeClient } from '../crdClient/crdClientImpl';
import { get, isEmpty, isUndefined, isNull } from 'lodash';
import { ApolloError } from 'apollo-server';

// utils
const stringifyVolumeSize = (volumeSize: number) => `${volumeSize}Gi`;
const parseVolumeSize = (volumeSizeFromK8s: string) => parseFloat(volumeSizeFromK8s.replace('Gi', ''));

export const getPvcName = (volumeName: string) => {
  return `dataset-${volumeName}`;
};

export default class K8sDatasetPvc {
  private namespace: string;
  private primehubGroupSc: string;
  private groupVolumeStorageClass: string;

  constructor({
    namespace,
    primehubGroupSc,
    groupVolumeStorageClass
  }: {
    namespace: string,
    primehubGroupSc: string,
    groupVolumeStorageClass: string
  }) {
    this.namespace = namespace || 'default';
    this.primehubGroupSc = primehubGroupSc;
    this.groupVolumeStorageClass = groupVolumeStorageClass || '';
  }

  public findOne = async (volumeName: string) => {
    try {
      const name = getPvcName(volumeName);
      const {body} = await corev1KubeClient.readNamespacedPersistentVolumeClaim(name, this.namespace);
      return this.propsMapping(body);
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    }
  }

  public create = async ({
    volumeName,
    volumeSize
  }: {
    volumeName: string,
    volumeSize: number
  }) => {
    try {
      const pvcName = getPvcName(volumeName);
      let annotations;
      let selector;

      if (!this.groupVolumeStorageClass) {
        // Use groupVolume controller to provision shared volume
        annotations = {
          'primehub-group': pvcName,
          'primehub-group-sc': this.primehubGroupSc
        };
        selector = {
          matchLabels: {
            'primehub-group': pvcName,
            'primehub-namespace': this.namespace
          }
        };
      }

      const body = {
        Kind: 'PersistentVolumeClaim',
        apiVersion: 'v1',
        metadata: {
          name: pvcName,
          annotations,
        },
        spec: {
          accessModes: ['ReadWriteMany'],
          dataSource: null,
          resources: {
            requests: {
              storage: stringifyVolumeSize(volumeSize)
            }
          },
          selector,
          storageClassName: this.groupVolumeStorageClass
        }
      };
      const {body: createdPvc} = await corev1KubeClient.createNamespacedPersistentVolumeClaim(this.namespace, body);
      return this.propsMapping(createdPvc);
    } catch (e) {
      if (e.statusCode === 409) {
        throw new ApolloError(e.message, 'RESOURCE_CONFLICT');
      }
      throw e;
    }
  }

  public async delete(volumeName: string) {
    try {
      await corev1KubeClient.deleteNamespacedPersistentVolumeClaim(getPvcName(volumeName), this.namespace);
    } catch (err) {
      if (err.statusCode === 404) {
        return;
      }
      throw err;
    }
  }

  private propsMapping = (response: any) => {
    const name = get(response, 'metadata.name');
    const originVolumeSize = get(response, 'spec.resources.requests.storage');
    const volumeSize = originVolumeSize ? parseVolumeSize(originVolumeSize) : null;

    return {
      name,
      volumeSize
    };
  }
}
