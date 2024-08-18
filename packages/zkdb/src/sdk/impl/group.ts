import { GroupDescription } from 'src/types/group.js';
import { ZKGroup } from '../interfaces/group.js';
import {
  addUsersToGroup,
  changeGroupDescription,
  excludeUsersFromGroup,
  getGroupDescription,
} from '../../repository/group.js';

export class ZKGroupImpl implements ZKGroup {
  private databaseName: string;
  private groupName: string;

  constructor(databaseName: string, groupName: string) {
    this.databaseName = databaseName;
    this.groupName = groupName;
  }

  async addUsers(userNames: string[]): Promise<boolean> {
    return addUsersToGroup(this.databaseName, this.groupName, userNames);
  }

  async removeUsers(userNames: string[]): Promise<boolean> {
    return excludeUsersFromGroup(this.databaseName, this.groupName, userNames);
  }

  async changeDescription(description: string): Promise<boolean> {
    return changeGroupDescription(
      this.databaseName,
      this.groupName,
      description
    );
  }

  async getDescription(): Promise<GroupDescription> {
    return getGroupDescription(this.databaseName, this.groupName);
  }
}
