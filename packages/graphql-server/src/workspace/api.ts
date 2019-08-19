import K8sNamespace, { K8sNamespaceResponse } from '../k8sResource/k8sNamespace';
import KcAdminClient from 'keycloak-admin';
import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
import { defaultWorkspaceId } from '../resolvers/constant';

export interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
  displayName: string;
  keycloakGroupId: string;
}

export default class WorkspaceApi {
  private defaultWorkspace: Workspace;
  private k8sNamespace: K8sNamespace = new K8sNamespace({
    labels: {
      app: 'primehub'
    }
  });
  private kcAdminClient: KcAdminClient;

  constructor({
    defaultNamespace,
    kcAdminClient
  }: {
    defaultNamespace: string,
    kcAdminClient: KcAdminClient
  }) {
    this.defaultWorkspace = {
      id: defaultWorkspaceId,
      name: 'default',
      isDefault: true,
      displayName: 'default',
      keycloakGroupId: null
    };
    this.kcAdminClient = kcAdminClient;
  }

  public find = async (): Promise<Workspace[]> => {
    const userCreatedNamespaces = await this.k8sNamespace.find();
    const workspaces = userCreatedNamespaces.map(this.transformNamespace);
    return [this.defaultWorkspace, ...workspaces];
  }

  public findOne = async (workspaceId: string): Promise<Workspace> => {
    if (workspaceId === this.defaultWorkspace.id) {
      return this.defaultWorkspace;
    }

    const namespace = await this.k8sNamespace.findOne(workspaceId);
    return this.transformNamespace(namespace);
  }

  public create = async ({
    name,
    displayName
  }: {
    name: string;
    displayName: string;
  }): Promise<Workspace> => {
    const namespaceName = `primehub-${name}`;
    // create keycloak group
    const group = await this.kcAdminClient.groups.create({
      name: `primehub-${name}`,
      attributes: {
        isWorkspace: ['true'],
        namespace: namespaceName
      }
    });

    const namespace = await this.k8sNamespace.create({
      name: namespaceName,
      displayName,
      keycloakGroupId: group.id
    });

    return this.transformNamespace(namespace);
  }

  public update = async (id: string, data: {displayName: string}): Promise<Workspace> => {
    if (id === this.defaultWorkspace.id) {
      throw new Error('you cannot update default workspace');
    }
    const namespace = await this.k8sNamespace.update(id, data);
    return this.transformNamespace(namespace);
  }

  public destroy = async (id: string): Promise<void> => {
    if (id === this.defaultWorkspace.id) {
      throw new Error('you cannot delete default workspace');
    }

    const namespace = await this.k8sNamespace.findOne(id);
    await this.kcAdminClient.groups.del({id: namespace.keycloakGroupId});
    await this.k8sNamespace.delete(namespace.id);
  }

  public createGroup = async ({
    workspaceId,
    name,
    attributes
  }: {
    workspaceId: string,
    name: string,
    attributes: any
  }): Promise<string> => {
    const namespace = await this.k8sNamespace.findOne(workspaceId);
    const group = await this.kcAdminClient.groups.setOrCreateChild({
        id: namespace.keycloakGroupId
      }, {
        name,
        attributes
      });
    return group.id;
  }

  public listGroups = async (workspaceId: string): Promise<GroupRepresentation[]> => {
    const namespace = await this.k8sNamespace.findOne(workspaceId);
    const groups = await this.kcAdminClient.groups.findOne({id: namespace.keycloakGroupId});
    return groups.subGroups;
  }

  private transformNamespace = (namespace: K8sNamespaceResponse): Workspace => {
    return {
      ...namespace,
      isDefault: false,
    };
  }
}
