import { client as kubeClient } from '../crdClient/crdClientImpl';
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
    const {body: {items}} = await this.resource(namespace).get();
    let data = items || [];
    if (type) {
      this.validateType(type);
      data = data.filter(record => get<string>(record, 'metadata.name', '').startsWith(this.getPrefixByType(type)));
    } else {
      data = data.filter(record => {
        const name = get<string>(record, 'metadata.name', '');
        return name.startsWith(GITSYNC_PREFIX) || name.startsWith(IMAGE_PREFIX);
      });
    }

    return data.map(this.propsMapping);
  }

  public findOne = async (name: string, namespace?: string) => {
    try {
      const resource = this.resource(namespace);
      const {body} = await resource(name).get();
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
      const {body} = await this.resource(namespace).post({
        body: {
          Kind: 'Secret',
          apiVersion: 'v1',
          metadata: {
            name: this.createPrefixByType(type, name),
            annotations: {
              displayName
            }
          },
          data: this.createDataByType(type, config),
          type
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

  public update = async (
    name: string, {displayName, config}: {displayName: string, config?: ConfigType}, namespace?: string) => {
    // api can only update displayName, data in config (ssh, .dockerconfigjson)
    const resource = this.resource(namespace);
    const {body: originalData} = await resource(name).get();
    const type: string = originalData.type;
    const data = isEmpty(config) ? {} : this.createDataByType(type, config, originalData);
    const annotations = displayName ? {displayName} : {};
    const {body} = await resource(name).patch({
      body: {
        metadata: {
          annotations
        },
        data
      }
    });
    return this.propsMapping(body);
  }

  public async delete(name: string, namespace?: string) {
    const resource = this.resource(namespace);
    return resource(name).delete();
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
      const obj = JSON.parse(new Buffer(dockerconfigjson, 'base64').toString('utf8'));
      const registryHost = Object.keys(obj.auths)[0];
      const auth = new Buffer(obj.auths[registryHost].auth, 'base64').toString('utf8');
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

  private resource = (namespace?: string) => {
    return kubeClient.api.v1.namespaces(namespace || this.namespace).secrets;
  }
}
