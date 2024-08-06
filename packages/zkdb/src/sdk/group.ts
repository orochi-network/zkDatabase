import {
  addUsersToGroup,
  changeGroupDescription,
  getGroupDescription,
} from '@zkdb/api';
import { ZKGroup } from './interfaces/group.js';
import { GroupDescription } from './types/group.js';

export class Group implements ZKGroup {
  private databaseName: string;
  private groupName: string;

  constructor(databaseName: string, groupName: string) {
    this.databaseName = databaseName;
    this.groupName = groupName;
  }

  async addUsers(userNames: string[]): Promise<boolean> {
    const result = await addUsersToGroup(
      this.databaseName,
      this.groupName,
      userNames
    );

    if (result.type === 'success') {
      return result.data;
    } else {
      return false;
    }
  }

  async changeDescription(description: string): Promise<boolean> {
    const result = await changeGroupDescription(
      this.databaseName,
      this.groupName,
      description
    );

    if (result.type === 'success') {
      return result.data;
    } else {
      return false;
    }
  }

  async getDescription(): Promise<GroupDescription> {
    const result = await getGroupDescription(this.databaseName, this.groupName);

    if (result.type === 'success') {
      return {
        description: result.data.description,
        createdAt: new Date(result.data.createdAt),
        creator: result.data.createdBy,
      };
    } else {
      throw Error(result.message);
    }
  }
}
