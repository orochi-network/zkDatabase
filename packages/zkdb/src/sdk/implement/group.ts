import { IApiClient } from '@zkdb/api';
import { TGroupDetail } from '@zkdb/common';
import { IGroup, TGroupConfig } from '../interfaces';

/**
 * This class is an implementation of the IGroup interface.
 * It provides methods to interact with a group in a database.
 * @class Group
 * @implements {IGroup}
 */
export class Group implements IGroup {
  private apiClient: IApiClient;

  private databaseName: string;

  private groupName: string;

  private get basicQuery() {
    return {
      databaseName: this.databaseName,
      groupName: this.groupName,
    };
  }

  constructor(apiClient: IApiClient, databaseName: string, groupName: string) {
    this.databaseName = databaseName;
    this.groupName = groupName;
    this.apiClient = apiClient;
  }

  async info(): Promise<TGroupDetail> {
    return (await this.apiClient.group.groupDetail(this.basicQuery)).unwrap();
  }

  async create(groupConfig: TGroupConfig): Promise<boolean> {
    return (
      await this.apiClient.group.groupCreate({
        ...this.basicQuery,
        groupDescription: groupConfig.groupDescription,
      })
    ).unwrap();
  }

  async update(groupConfig: TGroupConfig): Promise<boolean> {
    return (
      await this.apiClient.group.groupUpdate({
        ...this.basicQuery,
        newGroupDescription: groupConfig.groupDescription,
        newGroupName: groupConfig.groupName,
      })
    ).unwrap();
  }

  async userAdd(listUser: string[]): Promise<boolean> {
    return (
      await this.apiClient.group.groupAddUser({
        ...this.basicQuery,
        listUser,
      })
    ).unwrap();
  }

  async userRemove(listUser: string[]): Promise<boolean> {
    return (
      await this.apiClient.group.groupRemoveUser({
        ...this.basicQuery,
        listUser,
      })
    ).unwrap();
  }
}
