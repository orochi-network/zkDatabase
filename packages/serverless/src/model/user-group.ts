import { ObjectId } from 'mongodb';
import ModelCollection from './collection';
import { ZKDATABASE_USER_GROUP_COLLECTION } from './abstract/database-engine';
import { ModelGeneral } from './general';
import ModelGroup from './group';

export type UserGroupSchema = {
  username: string;
  groupId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export class ModelUserGroup extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_USER_GROUP_COLLECTION);
  }

  public async checkMembership(
    username: string,
    groupname: string
  ): Promise<boolean> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const group = await modelGroup.findOne({ groupName: groupname });
    if (!group) {
      return false;
    }
    const matchedRecord = await this.count({ username, groupId: group._id });
    return matchedRecord === 1;
  }

  public async listUserGroupName(username: string): Promise<string[]> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const groupsList = await modelGroup.find({
      _id: { $in: await this.listUserGroupId(username) },
    });
    return groupsList.map((group) => group.groupName);
  }

  public async listUserGroupId(username: string): Promise<ObjectId[]> {
    const userGroups = await this.find({ username });
    return userGroups.map((userGroup) => userGroup.groupId);
  }

  public async groupNameToGroupId(groupName: string[]): Promise<ObjectId[]> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const availableGroups = await modelGroup.find({
      groupName: { $in: groupName },
    });
    return availableGroups.map((group) => group._id);
  }

  public async addUserToGroup(username: string, groupName: string[]) {
    const groupOfUser = await this.listUserGroupId(username);
    const groupIdToAdd = await this.groupNameToGroupId(groupName);
    const newGroupIdToAdd = groupIdToAdd.filter(
      (g) => !groupOfUser.includes(g)
    );

    return this.insertMany(
      newGroupIdToAdd.map((groupId) => ({
        username,
        groupId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'username',
      'groupId',
    ]);
  }
}

export default ModelUserGroup;
