import { ObjectId, Document, FindOptions, BulkWriteOptions } from 'mongodb';
import {
  DatabaseEngine,
  ModelCollection,
  ModelGeneral,
  NetworkId,
  zkDatabaseConstants,
} from '@zkdb/storage';
import ModelGroup, { GroupSchema } from './group.js';

export interface DocumentUserGroup extends Document {
  userName: string;
  groupId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type TGroupInfo = GroupSchema & { members: DocumentUserGroup[] };

export class ModelUserGroup extends ModelGeneral<DocumentUserGroup> {
  private static collectionName =
    zkDatabaseConstants.databaseCollections.userGroup;

  private constructor(databaseName: string) {
    super(databaseName, ModelUserGroup.collectionName);
  }

  public static getInstance(databaseName: string, networkId: NetworkId) {
    return new ModelUserGroup(
      DatabaseEngine.getValidName(databaseName, networkId)
    );
  }

  public async checkMembership(
    userName: string,
    groupName: string,
    networkId: NetworkId
  ): Promise<boolean> {
    const modelGroup = ModelGroup.getInstance(this.databaseName, networkId);
    const group = await modelGroup.findOne({ groupName });
    if (!group) {
      return false;
    }
    const matchedRecord = await this.count({ userName, groupId: group._id });
    return matchedRecord === 1;
  }


  // TODO: Move logic to the domain layer
  public async listGroupByUserName(
    userName: string,
    networkId: NetworkId,
    options?: FindOptions
  ): Promise<string[]> {
    const modelGroup = ModelGroup.getInstance(this.databaseName, networkId);
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
    return userGroups.map((userGroup) => userGroup.groupId).toArray();
  }

  public async groupNameToGroupId(groupName: string[], networkId: NetworkId): Promise<ObjectId[]> {
    const modelGroup = ModelGroup.getInstance(this.databaseName, networkId);
    const availableGroups = await modelGroup.find({
      groupName: { $in: groupName },
    });
    return availableGroups.map((group) => group._id).toArray();
  }

  public async addUserToGroup(
    userName: string,
    groupName: string[],
    networkId: NetworkId,
    options?: BulkWriteOptions
  ) {
    const groupOfUser = await this.listGroupId(userName);
    const groupIdToAdd = await this.groupNameToGroupId(groupName, networkId);
    const newGroupIdToAdd = groupIdToAdd.filter(
      (g) => !groupOfUser.includes(g)
    );

    const operations = newGroupIdToAdd.map((groupId) => ({
      updateOne: {
        filter: { userName, groupId },
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
    networkId: NetworkId,
    options?: BulkWriteOptions
  ) {
    const groupId = (await this.groupNameToGroupId([groupName], networkId))[0];

    const operations = userNames.map((userName) => ({
      updateOne: {
        filter: { userName, groupId },
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
    networkId: NetworkId,
    options?: BulkWriteOptions
  ) {
    const groupId = (await this.groupNameToGroupId([groupName], networkId))[0];

    const operations = userNames.map((userName) => ({
      deleteOne: {
        filter: { userName, groupId },
      },
    }));

    return this.collection.bulkWrite(operations, options);
  }

  public static async init(databaseName: string, networkId: NetworkId) {
    const collection = ModelCollection.getInstance(
      databaseName,
      ModelUserGroup.collectionName,
      networkId
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1 }, { unique: false });
    }
  }
}

export default ModelUserGroup;
