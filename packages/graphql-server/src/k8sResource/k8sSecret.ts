import * as k8s from '@kubernetes/client-node';
import { corev1KubeClient } from '../crdClient/crdClientImpl';
import { get, isEmpty, isUndefined, isNull } from 'lodash';
import { ApolloError } from 'apollo-server';

export const PASSWORD_HOLDER = '******';

// type
export interface ConfigType {
  secret?: string;
  registryHost?: string;
  username?: string;
  password?: string;
}

// constants
export const GITSYNC_PREFIX = 'gitsync-secret-';
export const IMAGE_PREFIX = 'image-';

export const SECRET_DOCKER_CONFIG_JSON_TYPE = 'kubernetes.io/dockerconfigjson';
export const SECRET_OPAQUE_TYPE = 'Opaque';

export const prefixFactory = (prefix: string) => (name: string) => `${prefix}${name}`;
export const removePrefixFactory = (prefix: string) => (name: string) => name.replace(prefix, '');

export default class K8sSecret {
  private namespace: string;
  private addGitSyncPrefix = prefixFactory(GITSYNC_PREFIX);
  private addImagePrefix = prefixFactory(IMAGE_PREFIX);
  private removeGitSyncPrefix = removePrefixFactory(GITSYNC_PREFIX);
  private removeImagePrefix = removePrefixFactory(IMAGE_PREFIX);

  constructor({
    namespace
  }: {
    namespace: string
  }) {
    this.namespace = namespace || 'default';
  }

  public find = async (type?: string, namespace?: string) => {
    const {body: {items}} = await corev1KubeClient.listNamespacedSecret(namespace || this.namespace);
    let data = items || [];
    if (type) {
      this.validateType(type);
      data = data.filter(record => {
        const name = record.metadata?.name || '';
        return name.startsWith(this.getPrefixByType(type));
      });
    } else {
      data = data.filter(record => {
        const name = record.metadata?.name || '';
        return name.startsWith(GITSYNC_PREFIX) || name.startsWith(IMAGE_PREFIX);
      });
    }

    return data.map(this.propsMapping);
  }

  public findOne = async (name: string, namespace?: string) => {
    try {
      const {body} = await corev1KubeClient.readNamespacedSecret(name, namespace || this.namespace);
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
    type,
    config,
    namespace
  }: {
    name: string,
    displayName: string,
    type: string,
    config?: ConfigType,
    namespace?: string
  }) => {
    try {
      this.validateType(type);
      const body = {
        kind: 'Secret',
        apiVersion: 'v1',
        metadata: {
          name: this.createPrefixByType(type, name),
          annotations: {
            displayName
          }
        },
        data: this.createDataByType(type, config),
        type
      };
      const { body: createdSecret } = await corev1KubeClient.createNamespacedSecret(namespace || this.namespace, body);
      return this.propsMapping(createdSecret);
    } catch (e) {
      if (e.statusCode === 409) {
        throw new ApolloError(e.message, 'RESOURCE_CONFLICT');
      }
      throw e;
    }
  }

  public update = async (
    name: string, {displayName, config}: {displayName: string, config?: ConfigType}, namespace?: string) => {
    // api can only update displayName, data in config (ssh, .dockerconfigjson)
    const {body: originalData} = await corev1KubeClient.readNamespacedSecret(name, namespace || this.namespace);
    const type: string = originalData.type;
    const data = isEmpty(config) ? {} : this.createDataByType(type, config, originalData);
    const annotations = displayName ? {displayName} : {};
    const body = {
      metadata: {
        annotations
      },
      data
    };
    const options = {
      headers: { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH },
    };
    const {body: updatedSecret} = await corev1KubeClient.patchNamespacedSecret(
      name,
      namespace || this.namespace,
      body,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      options
    );
    return this.propsMapping(updatedSecret);
  }

  public async delete(name: string, namespace?: string) {
    return corev1KubeClient.deleteNamespacedSecret(name, namespace || this.namespace);
  }

  private propsMapping = (response: any) => {
    // filter out secret
    const name = get(response, 'metadata.name');
    const type = get(response, 'type');
    let additionalProps;
    if (type === SECRET_DOCKER_CONFIG_JSON_TYPE) {
      const originalConfig = this.decodeDockerConfig(get(response, ['data', '.dockerconfigjson']));
      additionalProps = {
        ...originalConfig,
        password: PASSWORD_HOLDER
      };
    } else if (type === SECRET_OPAQUE_TYPE) {
      const secret = isEmpty(get(response, ['data', 'ssh'])) ? null : PASSWORD_HOLDER;
      additionalProps = {
        secret
      };
    }

    return {
      id: name,
      type,
      name: this.removePrefixByType(type, name),
      displayName: get(response, 'metadata.annotations.displayName'),
      ...additionalProps
    };
  }

  private validateType(type: string) {
    if (type !== SECRET_DOCKER_CONFIG_JSON_TYPE && type !== SECRET_OPAQUE_TYPE) {
      // tslint:disable-next-line:max-line-length
      throw new Error(`type should be either ${SECRET_DOCKER_CONFIG_JSON_TYPE} or ${SECRET_OPAQUE_TYPE}, but got ${type}`);
    }
  }

  private getPrefixByType(type: string) {
    return (type === SECRET_OPAQUE_TYPE) ? GITSYNC_PREFIX : IMAGE_PREFIX;
  }

  private createPrefixByType = (type: string, name: string) => {
    return (type === SECRET_OPAQUE_TYPE) ? this.addGitSyncPrefix(name) : this.addImagePrefix(name);
  }

  private removePrefixByType = (type: string, name: string) => {
    return (type === SECRET_OPAQUE_TYPE) ? this.removeGitSyncPrefix(name) : this.removeImagePrefix(name);
  }

  private createDataByType = (
    type: string, props: ConfigType, originalResponse?: any) => {
    if (type === SECRET_OPAQUE_TYPE) {
      return {
        ssh: this.toBase64(props.secret)
      };
    }

    if (type === SECRET_DOCKER_CONFIG_JSON_TYPE) {
      let registryHost = props.registryHost;
      let username = props.username;
      // tslint:disable-next-line:max-line-length
      let password = (isUndefined(props.password) || isNull(props.password) || props.password === PASSWORD_HOLDER) ? null : props.password;
      if (originalResponse) {
        const originalConfig = this.decodeDockerConfig(get(originalResponse, ['data', '.dockerconfigjson']));
        registryHost = registryHost || originalConfig.registryHost;
        username = username || originalConfig.username;
        password = password || originalConfig.password;
      }

      return {
        '.dockerconfigjson': this.toBase64(
          JSON.stringify({
            auths: {[registryHost]: {auth: this.toBase64(`${username}:${password}`)}}
          })
        )
      };
    }

    throw new Error(`type ${type} not valid`);
  }

  private decodeDockerConfig = (dockerconfigjson: string) => {
    try {
      const obj = JSON.parse(Buffer.from(dockerconfigjson, 'base64').toString('utf8'));
      const registryHost = Object.keys(obj.auths)[0];
      const auth = Buffer.from(obj.auths[registryHost].auth, 'base64').toString('utf8');
      const authSplit = auth.split(':');
      const username = authSplit[0];
      const password = authSplit.slice(1).join(':');
      return {
        registryHost,
        username,
        password
      };
    } catch (err) {
      return {};
    }
  }

  private toBase64(str: string) {
    return Buffer.from(str).toString('base64');
  }
}
