/* eslint-disable no-unused-vars */
import { GroupDescription } from '../../../sdk/types/group.js';

export interface GroupQuery {
  addUsers(userNames: string[]): Promise<boolean>;
  removeUsers(userNames: string[]): Promise<boolean>;
  getDescription(): Promise<GroupDescription>;
  changeDescription(description: string): Promise<boolean>;
}
