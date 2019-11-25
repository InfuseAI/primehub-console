import K8sNamespace, { K8sNamespaceResponse } from '../k8sResource/k8sNamespace';
import KcAdminClient from 'keycloak-admin';
import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
import { defaultWorkspaceId } from '../resolvers/constant';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';

export interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
  displayName: string;
  keycloakGroupId: string;
}

export const isKeycloakGroupNameWorkspace = (name: string) => {
  return name && name.startsWith('primehub-');
};

export default class WorkspaceApi {
  private defaultWorkspace: Workspace;
  private k8sNamespace: K8sNamespace = new K8sNamespace({
    labels: {
      app: 'primehub'
    }
  });
  private kcAdminClient: KcAdminClient;
  private enableWorkspace: boolean;

  constructor({
    defaultNamespace,
    enableWorkspace,
    kcAdminClient
  }: {
    defaultNamespace: string,
    enableWorkspace: boolean,
    kcAdminClient: KcAdminClient
  }) {
    this.defaultWorkspace = {
      id: defaultWorkspaceId,
      name: 'default',
      isDefault: true,
      displayName: 'default',
      keycloakGroupId: null
    };
    this.enableWorkspace = enableWorkspace;
    this.kcAdminClient = kcAdminClient;
  }

  public find = async (): Promise<Workspace[]> => {
    const userCreatedNamespaces = await this.k8sNamespace.find();
    const workspaces = userCreatedNamespaces.map(this.transformNamespace);
    return this.enableWorkspace ? [this.defaultWorkspace, ...workspaces] : [this.defaultWorkspace];
  }

  public findOne = async (workspaceId: string): Promise<Workspace> => {
    if (workspaceId === this.defaultWorkspace.id) {
      return this.defaultWorkspace;
    }

    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
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
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    const namespaceName = `primehub-${name}`;
    // create keycloak group
    const group = await this.kcAdminClient.groups.create({
      name: `primehub-${name}`,
      attributes: {
        isWorkspace: ['true'],
        namespace: [namespaceName]
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
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    if (id === this.defaultWorkspace.id) {
      throw new Error('you cannot update default workspace');
    }

    const namespace = await this.k8sNamespace.update(id, data);
    return this.transformNamespace(namespace);
  }

  public destroy = async (id: string): Promise<void> => {
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    if (id === this.defaultWorkspace.id) {
      throw new Error('you cannot delete default workspace');
    }

    const namespace = await this.k8sNamespace.findOne(id);
    await this.kcAdminClient.groups.del({id: namespace.keycloakGroupId});
    await this.k8sNamespace.delete(namespace.id);
  }

  public addMember = async (id: string, userId: string): Promise<void> => {
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    if (id === this.defaultWorkspace.id) {
      throw new Error('you cannot addMember in default workspace');
    }

    const namespace = await this.k8sNamespace.findOne(id);
    const keycloakGroupId = namespace.keycloakGroupId;
    await this.kcAdminClient.users.addToGroup({
      id: userId,
      groupId: keycloakGroupId
    });
  }

  public listMembers = async (id: string): Promise<UserRepresentation[]> => {
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    if (id === this.defaultWorkspace.id) {
      throw new Error('you cannot listMembers in default workspace');
    }

    const namespace = await this.k8sNamespace.findOne(id);
    const keycloakGroupId = namespace.keycloakGroupId;
    return this.kcAdminClient.groups.listMembers({
      id: keycloakGroupId
    });
  }

  public delMember = async (id: string, userId: string): Promise<void> => {
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    if (id === this.defaultWorkspace.id) {
      throw new Error('you cannot delMember in default workspace');
    }

    const namespace = await this.k8sNamespace.findOne(id);
    const keycloakGroupId = namespace.keycloakGroupId;
    const group = await this.kcAdminClient.groups.findOne({id});

    // remove from all children groups first
    const subGroups = group.subGroups || [];
    await Promise.all(subGroups.map(async (subGroup: GroupRepresentation) => {
      return this.kcAdminClient.users.delFromGroup({
        id: userId,
        groupId: subGroup.id
      });
    }));

    // remove from workspace group
    await this.kcAdminClient.users.delFromGroup({
      id: userId,
      groupId: keycloakGroupId
    });
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
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    if (workspaceId === this.defaultWorkspace.id) {
      throw new Error('you cannot createGroup in default workspace');
    }

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
    if (!this.enableWorkspace) {
      throw new Error(`workspace not enabled`);
    }

    if (workspaceId === this.defaultWorkspace.id) {
      throw new Error('you cannot listGroups in default workspace');
    }

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
