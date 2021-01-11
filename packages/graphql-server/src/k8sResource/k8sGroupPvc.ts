import { client as kubeClient } from '../crdClient/crdClientImpl';
import { get, isEmpty, isUndefined, isNull } from 'lodash';
import { ApolloError } from 'apollo-server';
import { toGroupPath } from '../utils/groupCheck';

// utils
const stringifyVolumeSize = (volumeSize: number) => `${volumeSize}Gi`;
const parseVolumeSize = (volumeSizeFromK8s: string) => parseFloat(volumeSizeFromK8s.replace('Gi', ''));

export const getPvcName = (groupName: string) => {
  return `project-${toGroupPath(groupName)}`;
};

export default class K8sGroupPvc {
  private namespace: string;
  private resource: any;
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
    this.resource = kubeClient.api.v1.namespaces(this.namespace).persistentvolumeclaims;
  }

  public findOne = async (groupName: string) => {
    try {
      const name = getPvcName(groupName);
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
    groupName,
    volumeSize
  }: {
    groupName: string,
    volumeSize: number
  }) => {
    try {
      const escapedGroupName = toGroupPath(groupName);
      const pvcName = getPvcName(groupName);
      const {body} = await this.resource.post({
        body: {
          Kind: 'PersistentVolumeClaim',
          apiVersion: 'v1',
          metadata: {
            name: pvcName,
            annotations: {
              'primehub-group': escapedGroupName,
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
                'primehub-group': escapedGroupName,
                'primehub-namespace': this.namespace
              }
            },
            storageClassName: this.groupVolumeStorageClass
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

  public async delete(groupName: string) {
    try {
      await this.resource(getPvcName(groupName)).delete();
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
