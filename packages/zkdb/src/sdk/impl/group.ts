import { IApiClient } from '@zkdb/api';
import { GroupDescription } from '../../types';
import { ZKGroup } from '../interfaces';
import { NetworkId } from '../../types/network';

export class ZKGroupImpl implements ZKGroup {
  private databaseName: string;
  private groupName: string;
  private apiClient: IApiClient;
  private networkId: NetworkId;

  constructor(
    databaseName: string,
    groupName: string,
    apiClient: IApiClient,
    networkId: NetworkId
  ) {
    this.databaseName = databaseName;
    this.groupName = groupName;
    this.apiClient = apiClient;
    this.networkId = networkId;
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
      networkId: this.networkId,
      databaseName: this.databaseName,
      groupName: this.groupName,
      userNames,
    });

    return result.unwrap();
  }

  async changeDescription(description: string): Promise<boolean> {
    const result = await this.apiClient.group.updateDescription({
      networkId: this.networkId,
      databaseName: this.databaseName,
      groupName: this.groupName,
      groupDescription: description,
    });

    return result.unwrap();
  }

  async getDescription(): Promise<GroupDescription> {
    const result = await this.apiClient.group.info({
      networkId: this.networkId,
      databaseName: this.databaseName,
      groupName: this.groupName,
    });

    const groupDescription = result.unwrap();
    return {
      groupName: groupDescription.groupName,
      description: groupDescription.description,
      createdAt: new Date(groupDescription.createdAt),
      createBy: groupDescription.createBy,
    };
  }
}
