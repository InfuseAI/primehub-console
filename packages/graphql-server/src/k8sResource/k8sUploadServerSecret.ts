import { corev1KubeClient } from '../crdClient/crdClientImpl';
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

  constructor({
    namespace
  }: {
    namespace: string
  }) {
    this.namespace = namespace || 'default';
  }

  public findOne = async (datasetName: string) => {
    try {
      const {body} = await corev1KubeClient.readNamespacedSecret(getUploadSecretName(datasetName), this.namespace);
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

      const body = {
        type: 'Opaque',
        Kind: 'Secret',
        apiVersion: 'v1',
        metadata: {
          name: secretName,
        },
        data: {
          auth: toBase64(htpasswd(username, plainTextPassword))
        }
      };
      await corev1KubeClient.createNamespacedSecret(this.namespace, body);
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
    const body = {
      data: {
        auth: toBase64(htpasswd(username, plainTextPassword))
      }
    };
    await corev1KubeClient.patchNamespacedSecret(secretName, this.namespace, body);
    return {
      secretName,
      username,
      password: plainTextPassword
    };
  }

  public async delete(datasetName: string) {
    try {
      await corev1KubeClient.deleteNamespacedSecret(getUploadSecretName(datasetName), this.namespace);
    } catch (err) {
      if (err.statusCode === 404) {
        return;
      }
      throw err;
    }
  }
}
