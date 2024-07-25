import { GroupDescription } from "../types/group.js";

export interface ZKGroup {
  addUsers(userNames: string[]): Promise<boolean>;
  getDescription(): Promise<GroupDescription>
  changeDescription(description: string): Promise<boolean>;
}
