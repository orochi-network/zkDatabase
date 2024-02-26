import { Document } from 'mongodb';
import {
  ZKDATABASE_USER_NOBODY,
  ZKDATABASE_USER_SYSTEM,
  ZKDATABASE_GLOBAL_DB,
} from '../../common/const';
import { ModelGeneral } from '../abstract/general';
import { getCurrentTime, objectToLookupPattern } from '../../helper/common';

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
  static collectionName: string = 'user';
  static defaultUsers: string[] = [
    ZKDATABASE_USER_NOBODY,
    ZKDATABASE_USER_SYSTEM,
  ];

  constructor() {
    super(ZKDATABASE_GLOBAL_DB, ModelUser.collectionName);
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
    if (await this.isUserExist({ userName, email, publicKey })) {
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
