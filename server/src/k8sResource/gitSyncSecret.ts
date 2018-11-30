import { client as kubeClient } from '../crdClient/crdClientImpl';
import { get } from 'lodash';
import { ApolloError } from 'apollo-server';

// constants
const PREFIX = 'gitsync-secret-';
export const gitSyncPrefix = (name: string) => `${PREFIX}${name}`;
export const removeGitSyncPrefix = (name: string) => name.replace(PREFIX, '');

export default class GitSyncSecret {
  private namespace: string;
  private resource: any;

  constructor({
    namespace
  }: {
    namespace: string
  }) {
    this.namespace = namespace || 'default';
    this.resource = kubeClient.api.v1.namespaces(this.namespace).secrets;
  }

  public async find() {
    const {body: {items}} = await this.resource.get();
    const data = (items || []).filter(record => get<string>(record, 'metadata.name', '').startsWith(PREFIX));
    return data.map(this.propsMapping);
  }

  public async findOne(name: string) {
    const {body} = await this.resource(name).get();
    return this.propsMapping(body);
  }

  public async create({name, displayName, secret}: {name: string, displayName: string, secret: string}) {
    try {
      const {body} = await this.resource.post({
        body: {
          Kind: 'Secret',
          apiVersion: 'v1',
          metadata: {
            name: gitSyncPrefix(name),
            annotations: {
              displayName
            }
          },
          data: {
            ssh: Buffer.from(secret).toString('base64')
          },
          type: 'Opaque'
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

  public async update(name: string, {displayName, secret}: {displayName: string, secret: string}) {
    const annotations = displayName ? {displayName} : {};
    const data = secret ? {ssh: Buffer.from(secret).toString('base64')} : {};
    const {body} = await this.resource(name).patch({
      body: {
        metadata: {
          annotations
        },
        data
      }
    });
    return this.propsMapping(body);
  }

  public async delete(name: string) {
    return this.resource(name).delete();
  }

  private propsMapping(response: any) {
    // filter out secret
    return {
      id: get(response, 'metadata.name'),
      name: removeGitSyncPrefix(get(response, 'metadata.name')),
      displayName: get(response, 'metadata.annotations.displayName')
    };
  }
}
