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

  async exist(): Promise<boolean> {
    const groupList = (
      await this.apiClient.group.groupListAll({
        databaseName: this.databaseName,
      })
    )
      .unwrap()
      .map((e) => e.groupName)
      .filter((e) => e.length > 0);
    return groupList.includes(this.groupName);
  }

  async info(): Promise<TGroupDetail | null> {
    return (await this.apiClient.group.groupDetail(this.basicQuery)).unwrap();
  }

  async create(
    groupConfig: Omit<TGroupConfig, 'groupName'> | undefined = undefined
  ): Promise<boolean> {
    return (
      await this.apiClient.group.groupCreate({
        ...this.basicQuery,
        groupDescription: groupConfig && groupConfig.groupDescription,
      })
    ).unwrap();
  }

  async update(groupConfig: Partial<TGroupConfig>): Promise<boolean> {
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
