import {defaultWorkspaceId} from '../resolvers/constant';
import WorkspaceApi from './api';
import { Context } from '../resolvers/interface';
import { get } from 'lodash';

export const createInResolver = (root: any, args: any, context: Context): CurrentWorkspace => {
  const workspaceIdInData: string = get(args, 'data.workspaceId');
  const workspaceIdInWhere: string = get(args, 'where.workspaceId');
  const workspaceId = workspaceIdInWhere || workspaceIdInData;
  if (!workspaceId || workspaceId === defaultWorkspaceId) {
    return new CurrentWorkspace(
      context.workspaceApi, context.everyoneGroupId, true, defaultWorkspaceId, context.crdNamespace);
  }

  return new CurrentWorkspace(
    context.workspaceApi, context.everyoneGroupId, false, workspaceId, context.crdNamespace);
};

export default class CurrentWorkspace {
  private isDefault: boolean;
  private workspaceApi: WorkspaceApi;
  private everyoneGroupId: string;
  private workspaceId: string;
  private crdNamespace: string;

  constructor(
    workspaceApi: WorkspaceApi,
    everyoneGroupId: string,
    isDefault: boolean,
    workspaceId: string,
    crdNamespace: string
  ) {
    this.isDefault = isDefault;
    this.workspaceApi = workspaceApi;
    this.everyoneGroupId = everyoneGroupId;
    this.workspaceId = workspaceId;
    this.crdNamespace = crdNamespace;
  }

  public checkIsDefault = (): boolean => {
    return this.isDefault;
  }

  public getWorkspaceId = (): string =>
    this.workspaceId

  public getEveryoneGroupId = async (): Promise<string> => {
    if (this.isDefault) {
      return this.everyoneGroupId;
    }

    const workspace = await this.workspaceApi.findOne(this.workspaceId);
    return workspace.keycloakGroupId;
  }

  public getK8sNamespace = (): string => {
    return this.isDefault ? this.crdNamespace : this.workspaceId;
  }
}
