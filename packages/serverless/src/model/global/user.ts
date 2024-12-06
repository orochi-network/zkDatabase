import { TUser, TUserRecord } from '@zkdb/common';
import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { WithoutId } from 'mongodb';
import {
  ZKDATABASE_USER_NOBODY,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const.js';
import { getCurrentTime, objectToLookupPattern } from '../../helper/common.js';

export class ModelUser extends ModelGeneral<WithoutId<TUserRecord>> {
  private static collectionName: string =
    zkDatabaseConstants.globalCollections.user;

  static defaultUsers: string[] = [
    ZKDATABASE_USER_NOBODY,
    ZKDATABASE_USER_SYSTEM,
  ];

  constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      ModelUser.collectionName
    );
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      ModelUser.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ userName: 1 }, { unique: true });
      collection.index({ publicKey: 1 }, { unique: true });
      collection.index({ email: 1 }, { unique: true });
    }
  }

  public static isValidUser(userName: string) {
    if (ModelUser.defaultUsers.includes(userName)) {
      throw new Error('Username is reserved');
    }
  }

  public async isUserExist(
    searchingInfo: Partial<Omit<TUser, 'activated' | 'userData'>>
  ) {
    // Search a user for given information is matched
    return (
      (await this.collection.countDocuments({
        $or: objectToLookupPattern(searchingInfo),
      })) > 0
    );
  }

  public async findUser(
    searchingInfo: Partial<Omit<TUser, 'activated' | 'userData'>>
  ) {
    // Search a user for given information is matched
    const result = await this.collection.find({
      $or: objectToLookupPattern(searchingInfo),
    });

    return result.toArray();
  }

  public async areUsersExist(userNames: string[]) {
    const users = await this.collection
      .find({
        userName: { $in: userNames },
      })
      .toArray();

    return userNames.length === users.length;
  }

  public async create(newUser: Omit<TUser, 'activated'>) {
    const { userData, email, publicKey, userName } = newUser;
    ModelUser.isValidUser(userName);
    if (!(await this.isUserExist({ userName, email, publicKey }))) {
      const record: WithoutId<TUserRecord> = {
        userName,
        email,
        publicKey,
        userData,
        activated: true,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      };
      const result = await this.insertOne(record);
      if (result && result?.acknowledged === true) {
        return record;
      }
    }
    return null;
  }
}

export default ModelUser;
