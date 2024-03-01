import { Document } from 'mongodb';
import { ModelGeneral, zkDatabaseConstants } from '@zkdb/storage';
import {
  ZKDATABASE_USER_NOBODY,
  ZKDATABASE_USER_SYSTEM
} from '../../common/const';
import { getCurrentTime, objectToLookupPattern } from '../../helper/common';
import ModelCollection from '../abstract/collection';

export interface DocumentUser extends Document {
  userName: string;
  email: string;
  publicKey: string;
  activated: boolean;
  userData: any;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelUser extends ModelGeneral<DocumentUser> {
  private static collectionName: string = zkDatabaseConstants.globalCollections.user;
  
  static defaultUsers: string[] = [
    ZKDATABASE_USER_NOBODY,
    ZKDATABASE_USER_SYSTEM,
  ];

  constructor() {
    super(zkDatabaseConstants.globalDatabase, ModelUser.collectionName);
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      ZKDATABASE_GLOBAL_DB,
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
    searchingInfo: Partial<
      Pick<DocumentUser, 'userName' | 'email' | 'publicKey'>
    >
  ) {
    // Search a user for given information is matched
    return (
      (await this.collection.countDocuments({
        $or: objectToLookupPattern(searchingInfo),
      })) > 0
    );
  }

  public async findUser(
    searchingInfo: Partial<
      Pick<DocumentUser, 'userName' | 'email' | 'publicKey'>
    >
  ) {
    // Search a user for given information is matched
    const result = await this.collection.find({
      $or: objectToLookupPattern(searchingInfo),
    });

    return result.toArray();
  }

  public async create(
    userName: string,
    email: string,
    publicKey: string,
    userData: any
  ) {
    ModelUser.isValidUser(userName);
    if (!(await this.isUserExist({ userName, email, publicKey }))) {
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
    return null;
  }
}

export default ModelUser;
