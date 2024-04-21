import { ObjectId, Document, FindOptions } from 'mongodb';
import {
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import ModelGroup from './group';

export interface DocumentUserGroup extends Document {
  userName: string;
  groupId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelUserGroup extends ModelGeneral<DocumentUserGroup> {
  private static collectionName =
    zkDatabaseConstants.databaseCollections.userGroup;

  constructor(databaseName: string) {
    super(databaseName, ModelUserGroup.collectionName);
  }

  public async checkMembership(
    userName: string,
    groupName: string
  ): Promise<boolean> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const group = await modelGroup.findOne({ groupName });
    if (!group) {
      return false;
    }
    const matchedRecord = await this.count({ userName, groupId: group._id });
    return matchedRecord === 1;
  }

  public async listGroupByUserName(
    userName: string,
    options?: FindOptions
  ): Promise<string[]> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const groupsList = await modelGroup.find(
      {
        _id: { $in: await this.listGroupId(userName) },
      },
      options
    );
    return groupsList.map((group) => group.groupName!).toArray();
  }

  public async listGroupId(userName: string): Promise<ObjectId[]> {
    const userGroups = await this.find({ userName });
    return userGroups.map((userGroup) => userGroup.groupId).toArray();
  }

  public async groupNameToGroupId(groupName: string[]): Promise<ObjectId[]> {
    const modelGroup = new ModelGroup(this.databaseName!);
    const availableGroups = await modelGroup.find({
      groupName: { $in: groupName },
    });
    return availableGroups.map((group) => group._id).toArray();
  }

  public async addUserToGroup(userName: string, groupName: string[]) {
    const groupOfUser = await this.listGroupId(userName);
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

  public static async init(databaseName: string) {
    const collection = ModelCollection.getInstance(
      databaseName,
      ModelUserGroup.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1 }, { unique: true });
    }
  }
}

export default ModelUserGroup;
