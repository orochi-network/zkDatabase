import { ApiClient, IApiClient } from '@zkdb/api';
import { TGroupDetail } from '@zkdb/common';
import { TGroupConfig, IGroup } from '../interfaces';

/**
 * This class is an implementation of the IGroup interface.
 * It provides methods to interact with a group in a database.
 * @class Group
 * @implements {IGroup}
 */
export class Group implements IGroup {
  private databaseName: string;

  private groupName: string;

  private apiClient: IApiClient;

  constructor(apiClient: IApiClient, databaseName: string, groupName: string) {
    this.databaseName = databaseName;
    this.groupName = groupName;
    this.apiClient = apiClient;
  }

  async info(): Promise<TGroupDetail> {
    return (
      await this.apiClient.group.groupDetail({
        databaseName: this.databaseName,
        groupName: this.groupName,
      })
    ).unwrap();
  }

  async create(groupConfig: TGroupConfig): Promise<boolean> {
    return (
      await this.apiClient.group.groupCreate({
        databaseName: this.databaseName,
        groupName: this.groupName,
        groupDescription: groupConfig.groupDescription,
      })
    ).unwrap();
  }

  async update(groupConfig: TGroupConfig): Promise<boolean> {
    return (
      await this.apiClient.group.groupUpdate({
        databaseName: this.databaseName,
        groupName: this.groupName,
        newGroupDescription: groupConfig.groupDescription,
        newGroupName: groupConfig.groupName,
      })
    ).unwrap();
  }

  async userAdd(listUser: string[]): Promise<boolean> {
    return (
      await this.apiClient.group.groupAddUser({
        databaseName: this.databaseName,
        groupName: this.groupName,
        listUser,
      })
    ).unwrap();
  }

  async userRemove(listUser: string[]): Promise<boolean> {
    return (
      await this.apiClient.group.groupRemoveUser({
        databaseName: this.databaseName,
        groupName: this.groupName,
        listUser,
      })
    ).unwrap();
  }
}
