import {defaultWorkspaceId} from '../resolvers/constant';
import WorkspaceApi from './api';
import { Context } from '../resolvers/interface';
import { get } from 'lodash';

export const createInResolver = (root: any, args: any, context: Context): CurrentWorkspace => {
  const workspaceIdInData: string = get(args, 'data.workspaceId');
  const workspaceIdInWhere: string = get(args, 'where.workspaceId');
  const workspaceId = workspaceIdInWhere || workspaceIdInData;
  if (!workspaceId || workspaceId === defaultWorkspaceId) {
    return new CurrentWorkspace(defaultWorkspaceId, context.workspaceApi, context.everyoneGroupId);
  }

  return new CurrentWorkspace(workspaceId, context.workspaceApi, context.everyoneGroupId);
};

export default class CurrentWorkspace {
  private workspaceId: string;
  private isDefault: boolean;
  private workspaceApi: WorkspaceApi;
  private everyoneGroupId: string;
  private defaultNamespace: string;

  constructor(workspaceId: string, workspaceApi: WorkspaceApi, everyoneGroupId: string, defaultNamespace: string) {
    this.workspaceId = workspaceId;
    this.isDefault = (workspaceId === defaultWorkspaceId);
    this.workspaceApi = workspaceApi;
    this.everyoneGroupId = everyoneGroupId;
    this.defaultNamespace = defaultNamespace;
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
    return this.isDefault ? this.defaultNamespace : this.workspaceId;
  }
}
