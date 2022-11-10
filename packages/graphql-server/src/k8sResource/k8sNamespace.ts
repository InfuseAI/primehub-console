import { corev1KubeClient } from '../crdClient/crdClientImpl';
import { get, isEmpty, reduce } from 'lodash';
import { ApolloError } from 'apollo-server';
import Boom from 'boom';

export interface K8sNamespaceResponse {
  id: string;
  name: string;
  displayName: string;
  keycloakGroupId: string;
}

export default class K8sNamespace {
  private labels: Record<string, string>;

  constructor({
    labels,
  }: {
    labels: Record<string, string>
  }) {
    this.labels = labels;
  }

  public find = async (): Promise<K8sNamespaceResponse[]> => {
    const labelSelector = this.labelStringify(this.labels);
    const {body: {items}} = await corev1KubeClient.listNamespace(
      undefined,
      undefined,
      undefined,
      undefined,
      labelSelector
    );
    return (items || []).map(this.propsMapping);
  }

  public findOne = async (name: string): Promise<K8sNamespaceResponse> => {
    try {
      const {body} = await corev1KubeClient.readNamespace(name);
      this.validateLabels(body);
      return this.propsMapping(body);
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    }
  }

  public create = async ({
    name,
    displayName,
    keycloakGroupId
  }: {
    name: string,
    displayName: string,
    keycloakGroupId: string
  }): Promise<K8sNamespaceResponse> => {
    try {
      // create
      const body = {
        Kind: 'Namespace',
        apiVersion: 'v1',
        metadata: {
          name,
          labels: this.labels,
          annotations: {
            displayName,
            kcGroupId: keycloakGroupId
          }
        }
      };
      const {body: created} = await corev1KubeClient.createNamespace(body);
      return this.propsMapping(created);
    } catch (e) {
      if (e.statusCode === 409) {
        throw new ApolloError(e.message, 'RESOURCE_CONFLICT');
      }
      throw e;
    }
  }

  public async update(name: string, data: {displayName: string}) {
    // validate first
    const {body: queryBody} = await corev1KubeClient.readNamespace(name);
    this.validateLabels(queryBody);

    // update
    const body = {
      metadata: {
        annotations: {
          displayName: data.displayName
        }
      }
    };
    const {body: updated} = await corev1KubeClient.patchNamespace(name, body);
    return this.propsMapping(body);
  }

  public async delete(name: string) {
    // validate first
    const {body: queryBody} = await corev1KubeClient.readNamespace(name);
    this.validateLabels(queryBody);

    // delete
    return corev1KubeClient.deleteNamespace(name);
  }

  private labelStringify = (labels: Record<string, string>) => {
    return Object.keys(labels).map(labelKey => {
      const labelValue = this.labels[labelKey];
      return `${labelKey}=${labelValue}`;
    }).join(',');
  }

  private propsMapping = (response: any): K8sNamespaceResponse => {
    // filter out secret
    const name: string = get(response, 'metadata.name');
    const keycloakGroupId: string = get(response, 'metadata.annotations.kcGroupId');
    const displayName: string = get(response, 'metadata.annotations.displayName');

    return {
      id: name,
      name,
      displayName,
      keycloakGroupId
    };
  }

  private validateLabels = (response: any) => {
    const name = get(response, 'metadata.name');
    const responseLabels = get(response, 'metadata.labels');
    Object.keys(this.labels).forEach(labelKey => {
      const labelValue = this.labels[labelKey];

      // if key not exists in response labels
      // or label value not match
      if (!responseLabels[labelKey] ||
          responseLabels[labelKey] !== labelValue) {
            throw Boom.forbidden(`not authorized to access namespace: ${name}`);
      }
    });
  }
}
