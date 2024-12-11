import { TUserGroup, TUserGroupRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import {
  BulkWriteOptions,
  ClientSession,
  FindOptions,
  InsertOneOptions,
  InsertOneResult,
  ObjectId,
  WithoutId,
} from 'mongodb';
import ModelGroup from './group.js';

export class ModelUserGroup extends ModelGeneral<WithoutId<TUserGroupRecord>> {
  private static collectionName =
    zkDatabaseConstant.databaseCollection.userGroup;

  constructor(databaseName: string) {
    super(databaseName, DB.service, ModelUserGroup.collectionName);
  }

  public async createUserGroup(
    args: WithoutId<TUserGroupRecord>,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<TUserGroup>> {
    return this.insertOne(args, options);
  }

  public async checkMembership(
    userName: string,
    groupName: string
  ): Promise<boolean> {
    const modelGroup = new ModelGroup(this.databaseName);
    const group = await modelGroup.findOne({ groupName });
    if (!group) {
      return false;
    }
    const matchedRecord = await this.count({
      userName,
      groupOjectId: group._id,
    });
    return matchedRecord === 1;
  }

  public async listGroupByUserName(
    userName: string,
    options?: FindOptions
  ): Promise<string[]> {
    const modelGroup = new ModelGroup(this.databaseName);
    const groupsList = await modelGroup.find(
      {
        _id: { $in: await this.listGroupId(userName) },
      },
      options
    );
    return groupsList.map((group) => group.groupName).toArray();
  }

  public async listGroupId(userName: string): Promise<ObjectId[]> {
    const userGroups = await this.find({ userName });
    return userGroups.map((userGroup) => userGroup.groupOjectId).toArray();
  }

  public async groupNameToGroupId(groupName: string[]): Promise<ObjectId[]> {
    const modelGroup = new ModelGroup(this.databaseName);
    const availableGroups = await modelGroup.find({
      groupName: { $in: groupName },
    });
    return availableGroups.map((group) => group._id).toArray();
  }

  public async addUserToGroup(
    userName: string,
    groupName: string[],
    options?: BulkWriteOptions
  ) {
    const groupOfUser = await this.listGroupId(userName);
    const groupIdToAdd = await this.groupNameToGroupId(groupName);
    const newGroupIdToAdd = groupIdToAdd.filter(
      (g) => !groupOfUser.includes(g)
    );

    const operations = newGroupIdToAdd.map((groupOjectId) => ({
      updateOne: {
        filter: { userName, groupOjectId },
        update: {
          $set: { updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));

    return this.collection.bulkWrite(operations, options);
  }

  public async addUsersToGroup(
    userNames: string[],
    groupName: string,
    options?: BulkWriteOptions
  ) {
    const groupOjectId = (await this.groupNameToGroupId([groupName]))[0];

    const operations = userNames.map((userName) => ({
      updateOne: {
        filter: { userName, groupOjectId },
        update: {
          $set: { updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));

    return this.collection.bulkWrite(operations, options);
  }

  public async removeUsersFromGroup(
    userNames: string[],
    groupName: string,
    options?: BulkWriteOptions
  ) {
    const groupOjectId = (await this.groupNameToGroupId([groupName]))[0];

    const operations = userNames.map((userName) => ({
      deleteOne: {
        filter: { userName, groupOjectId },
      },
    }));

    return this.collection.bulkWrite(operations, options);
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      databaseName,
      DB.service,
      ModelUserGroup.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ userName: 1 }, { unique: false, session });
      await collection.index({ groupName: 1 }, { unique: false, session });
      await collection.index({ groupOjectId: 1 }, { unique: true, session });
      await collection.index({ userObjectId: 1 }, { unique: true, session });

      await addTimestampMongoDB(collection, session);
    }
  }
}

export default ModelUserGroup;
