import { IApiClient } from '@zkdb/api';
import { GroupDescription } from '../../types';
import { GroupConfig, ZKGroup } from '../interfaces';

export class ZKGroupImpl implements ZKGroup {
  private databaseName: string;
  private groupName: string;
  private apiClient: IApiClient;

  constructor(databaseName: string, groupName: string, apiClient: IApiClient) {
    this.databaseName = databaseName;
    this.groupName = groupName;
    this.apiClient = apiClient;
  }

  async create(groupConfig: GroupConfig): Promise<boolean> {
    const result = await this.apiClient.group.create({
      databaseName: this.databaseName,
      groupName: this.groupName,
      groupDescription: groupConfig.description,
    });

    return result.unwrap();
  }

  async userAdd(userNames: string[]): Promise<boolean> {
    const result = await this.apiClient.group.addUser({
      databaseName: this.databaseName,
      groupName: this.groupName,
      userNames,
    });

    return result.unwrap();
  }

  async userRemove(userNames: string[]): Promise<boolean> {
    const result = await this.apiClient.group.removeUser({
      databaseName: this.databaseName,
      groupName: this.groupName,
      userNames,
    });

    return result.unwrap();
  }

  async update(groupConfig: GroupConfig): Promise<boolean> {
    const result = await this.apiClient.group.updateDescription({
      databaseName: this.databaseName,
      groupName: this.groupName,
      groupDescription: groupConfig.description,
    });

    return result.unwrap();
  }

  async info(): Promise<GroupDescription> {
    const result = await this.apiClient.group.info({
      databaseName: this.databaseName,
      groupName: this.groupName,
    });

    const groupDescription = result.unwrap();
    return {
      groupName: groupDescription.groupName,
      description: groupDescription.description,
      createdAt: new Date(groupDescription.createdAt),
      createdBy: groupDescription.createdBy,
    };
  }
}
