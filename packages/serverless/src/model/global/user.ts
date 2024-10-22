import { Document } from 'mongodb';
import {
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
  NetworkId,
} from '@zkdb/storage';
import {
  ZKDATABASE_USER_NOBODY,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const.js';
import { getCurrentTime, objectToLookupPattern } from '../../helper/common.js';

export interface DocumentUser extends Document {
  userName: string;
  email: string;
  publicKey: string;
  activated: boolean;
  userData: any;
  createdAt: Date;
  updatedAt: Date;
  networkId: NetworkId;
}

export class ModelUser extends ModelGeneral<DocumentUser> {
  private static collectionName: string =
    zkDatabaseConstants.globalCollections.user;

  static defaultUsers: string[] = [
    ZKDATABASE_USER_NOBODY,
    ZKDATABASE_USER_SYSTEM,
  ];

  constructor() {
    super(zkDatabaseConstants.globalDatabase, ModelUser.collectionName);
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
      ModelUser.collectionName
    );

    if (!(await collection.isExist())) {
      await collection.index(
        { networkId: 1, userName: 1 },
        { unique: true, name: 'unique_userName_per_network' }
      );

      await collection.index(
        { networkId: 1, publicKey: 1 },
        { unique: true, name: 'unique_publicKey_per_network' }
      );

      await collection.index(
        { networkId: 1, email: 1 },
        { unique: true, name: 'unique_email_per_network' }
      );

      await collection.index(
        { networkId: 1 },
        { unique: false, name: 'index_networkId' }
      );
    }
  }

  public static isValidUser(userName: string) {
    if (ModelUser.defaultUsers.includes(userName)) {
      throw new Error('Username is reserved');
    }
  }

  public async isUserExist(
    searchingInfo: Partial<
      Pick<DocumentUser, 'userName' | 'email' | 'publicKey'>
    >,
    networkId: NetworkId
  ) {
    // Search a user for given information is matched
    return (
      (await this.collection.countDocuments({
        $and: [{ networkId }, { $or: objectToLookupPattern(searchingInfo) }],
      })) > 0
    );
  }

  public async findUser(
    searchingInfo: Partial<
      Pick<DocumentUser, 'userName' | 'email' | 'publicKey'>
    >,
    networkId: NetworkId
  ) {
    // Search a user for given information is matched
    const result = await this.collection.find({
      $and: [{ networkId }, { $or: objectToLookupPattern(searchingInfo) }],
    });

    return result.toArray();
  }

  public async areUsersExist(userNames: string[], networkId: NetworkId) {
    const users = await this.collection
      .find({
        userName: { $in: userNames },
        networkId,
      })
      .toArray();

    return userNames.length === users.length;
  }

  public async create(
    userName: string,
    email: string,
    publicKey: string,
    userData: any,
    networkId: NetworkId
  ) {
    ModelUser.isValidUser(userName);
    if (!(await this.isUserExist({ userName, email, publicKey }, networkId))) {
      return this.insertOne({
        userName,
        email,
        publicKey,
        userData,
        activated: true,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
        networkId,
      });
    }
    return null;
  }
}

export default ModelUser;
