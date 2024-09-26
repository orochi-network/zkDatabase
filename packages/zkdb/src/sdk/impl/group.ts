import { IApiClient } from '@zkdb/api';
import { GroupDescription } from '../../types';
import { ZKGroup } from '../interfaces';

export class ZKGroupImpl implements ZKGroup {
  private databaseName: string;
  private groupName: string;
  private apiClient: IApiClient;

  constructor(databaseName: string, groupName: string, apiClient: IApiClient) {
    this.databaseName = databaseName;
    this.groupName = groupName;
    this.apiClient = apiClient;
  }

  async addUsers(userNames: string[]): Promise<boolean> {
    const result = await this.apiClient.group.addUser({
      databaseName: this.databaseName,
      groupName: this.groupName,
      userNames,
    });

    return result.unwrap();
  }

  async removeUsers(userNames: string[]): Promise<boolean> {
    const result = await this.apiClient.group.removeUser({
      databaseName: this.databaseName,
      groupName: this.groupName,
      userNames,
    });

    return result.unwrap();
  }

  async changeDescription(description: string): Promise<boolean> {
    const result = await this.apiClient.group.updateDescription({
      databaseName: this.databaseName,
      groupName: this.groupName,
      groupDescription: description,
    });

    return result.unwrap();
  }

  async getDescription(): Promise<GroupDescription> {
    const result = await this.apiClient.group.info({
      databaseName: this.databaseName,
      groupName: this.groupName,
    });

    const groupDescription = result.unwrap();
    return {
      name: groupDescription.name,
      description: groupDescription.description,
      createdAt: new Date(groupDescription.createdAt),
      createdBy: groupDescription.createdBy,
    };
  }
}
