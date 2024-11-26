/* eslint-disable no-unused-vars */
import { GroupDescription } from '../../types';

export type GroupConfig = {
  description: string;
};

export interface ZKGroup {
  info(): Promise<GroupDescription>;

  create(groupConfig: GroupConfig): Promise<boolean>;

  update(groupConfig: GroupConfig): Promise<boolean>;

  userAdd(userNames: string[]): Promise<boolean>;

  userRemove(userNames: string[]): Promise<boolean>;
}
