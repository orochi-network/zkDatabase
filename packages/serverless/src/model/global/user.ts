import { TUser, TUserRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, InsertOneResult, WithoutId } from 'mongodb';
import {
  ZKDATABASE_USER_NOBODY,
  ZKDATABASE_USER_SYSTEM,
} from '../../common/const.js';
import { getCurrentTime, objectToLookupPattern } from '../../helper/common.js';
import logger from '../../helper/logger.js';

export class ModelUser extends ModelGeneral<WithoutId<TUserRecord>> {
  private static collectionName: string =
    zkDatabaseConstant.globalCollection.user;

  static defaultUsers: string[] = [
    ZKDATABASE_USER_NOBODY,
    ZKDATABASE_USER_SYSTEM,
  ];

  constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DB.service,
      ModelUser.collectionName
    );
  }

  /**
   * Validates whether the given username is valid.
   *
   * @param userName - The username to validate.
   * @returns `true` if the username is valid, otherwise `false`.
   */
  public static isValid(userName: string): boolean {
    return ModelUser.defaultUsers.includes(userName);
  }

  /**
   * Checks if a user exists based on the provided search criteria.
   *
   * @param searchingInfo - Partial search criteria for a user, excluding 'activated' and 'userData' fields.
   * @returns A promise that resolves to `true` if the user exists, otherwise `false`.
   */
  public async isExist(
    searchingInfo: Partial<Omit<TUser, 'activated' | 'userData'>>
  ): Promise<boolean> {
    // Search a user for given information is matched
    return (
      (await this.collection.countDocuments({
        $or: objectToLookupPattern(searchingInfo),
      })) > 0
    );
  }

  /**
   * Finds a user based on the provided search criteria.
   *
   * @param searchingInfo - Partial search criteria for a user, excluding 'activated' and 'userData' fields.
   * @returns A promise resolving to the user if found, or `undefined` if not found.
   */
  public async findUser(
    searchingInfo: Partial<Omit<TUser, 'activated' | 'userData'>>
  ): Promise<TUserRecord[]> {
    // Search a user for given information is matched
    const result = await this.collection.find({
      $or: objectToLookupPattern(searchingInfo),
    });

    return result.toArray();
  }

  /**
   * Checks if a list of usernames exist.
   *
   * @param listUserName - An array of usernames to check for existence.
   * @returns A promise that resolves to `true` if all usernames exist, otherwise `false`.
   */
  public async isListUserExist(listUserName: string[]): Promise<boolean> {
    const listUser = await this.collection
      .find({
        userName: { $in: listUserName },
      })
      .toArray();

    return listUserName.length === listUser.length;
  }

  /**
   * Creates a new user with the provided details.
   *
   * @param newUser - The details of the new user to be created, excluding the 'activated' field.
   * @returns A promise resolving to the created user or relevant response.
   */
  public async create(
    newUser: Omit<TUser, 'activated'>
  ): Promise<InsertOneResult<TUserRecord>> {
    const { userData, email, publicKey, userName } = newUser;

    if (await this.isExist({ userName, email, publicKey })) {
      // Case userName or email already existed
      logger.info(`username: ${userName}, email ${email} already existed`);
      throw new Error(`User already existed`);
    }

    return this.insertOne({
      userName,
      email,
      publicKey,
      userData,
      activated: true,
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime(),
    });
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalDatabase,
      DB.service,
      ModelUser.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ userName: 1 }, { unique: true, session });
      await collection.index({ publicKey: 1 }, { unique: true, session });
      await collection.index({ email: 1 }, { unique: true, session });

      await addTimestampMongoDB(collection, session);
    }
  }
}

export default ModelUser;
