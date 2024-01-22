import { ObjectId, Timestamp } from 'mongodb';
import ModelCollection from '../abstract/collection';
import { ZKDATABASE_USER_GROUP_COLLECTION } from '../../common/const';
import { ModelGeneral } from '../abstract/general';
import ModelGroup from './group';

export type DocumentUserGroup = {
  userName: string;
  groupId: ObjectId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export class ModelUserGroup extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_USER_GROUP_COLLECTION);
  }

  public async checkMembership(
    userName: string,
    groupname: string
  ): Promise<boolean> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const group = await modelGroup.findOne({ groupName: groupname });
    if (!group) {
      return false;
    }
    const matchedRecord = await this.count({ userName, groupId: group._id });
    return matchedRecord === 1;
  }

  public async listUserGroupName(userName: string): Promise<string[]> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const groupsList = await modelGroup.find({
      _id: { $in: await this.listUserGroupId(userName) },
    });
    return groupsList.map((group) => group.groupName);
  }

  public async listUserGroupId(userName: string): Promise<ObjectId[]> {
    const userGroups = await this.find({ userName });
    return userGroups.map((userGroup) => userGroup.groupId);
  }

  public async groupNameToGroupId(groupName: string[]): Promise<ObjectId[]> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const availableGroups = await modelGroup.find({
      groupName: { $in: groupName },
    });
    return availableGroups.map((group) => group._id);
  }

  public async addUserToGroup(userName: string, groupName: string[]) {
    const groupOfUser = await this.listUserGroupId(userName);
    const groupIdToAdd = await this.groupNameToGroupId(groupName);
    const newGroupIdToAdd = groupIdToAdd.filter(
      (g) => !groupOfUser.includes(g)
    );

    return this.insertMany(
      newGroupIdToAdd.map((groupId) => ({
        userName,
        groupId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'userName',
      'groupId',
    ]);
  }
}

export default ModelUserGroup;
