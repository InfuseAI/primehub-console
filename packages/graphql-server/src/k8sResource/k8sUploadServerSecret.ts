import { client as kubeClient } from '../crdClient/crdClientImpl';
import { get, isEmpty, isUndefined, isNull } from 'lodash';
import { ApolloError } from 'apollo-server';
import md5 = require('apache-md5');

const genRandomString = () => {
  return Math.random().toString(36).slice(2);
};

const toBase64 = (str: string) => {
  return Buffer.from(str).toString('base64');
};

const htpasswd = (username: string, password: string) => {
  return `${username}:${md5(password)}`;
};

export const getUploadSecretName = (datasetName: string) => {
  return `dataset-${datasetName}`;
};

export default class K8sUploadServerSecret {
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

  public findOne = async (datasetName: string) => {
    try {
      const {body} = await this.resource(getUploadSecretName(datasetName)).get();
      const name = get(body, 'metadata.name');
      return {
        secretName: name
      };
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    }
  }

  public create = async ({
    datasetName
  }: {
    datasetName: string
  }): Promise<{secretName: string, username: string, password: string}> => {
    try {
      const secretName = getUploadSecretName(datasetName);
      const username = secretName;
      const plainTextPassword = genRandomString();
      const {body} = await this.resource.post({
        body: {
          type: 'Opaque',
          Kind: 'Secret',
          apiVersion: 'v1',
          metadata: {
            name: secretName,
          },
          data: {
            auth: toBase64(htpasswd(username, plainTextPassword))
          }
        }
      });
      return {
        secretName,
        username,
        password: plainTextPassword
      };
    } catch (e) {
      if (e.statusCode === 409) {
        throw new ApolloError(e.message, 'RESOURCE_CONFLICT');
      }
      throw e;
    }
  }

  public regenerateSecret = async (
    datasetName: string
  ): Promise<{secretName: string, username: string, password: string}> => {
    const secretName = getUploadSecretName(datasetName);
    const username = secretName;
    const plainTextPassword = genRandomString();
    await this.resource(secretName).patch({
      body: {
        data: {
          auth: toBase64(htpasswd(username, plainTextPassword))
        }
      }
    });
    return {
      secretName,
      username,
      password: plainTextPassword
    };
  }

  public async delete(datasetName: string) {
    try {
      await this.resource(getUploadSecretName(datasetName)).delete();
    } catch (err) {
      if (err.statusCode === 404) {
        return;
      }
      throw err;
    }
  }
}
