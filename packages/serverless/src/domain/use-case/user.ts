import {
  TMinaSignature,
  TPagination,
  TPaginationReturn,
  TUser,
  TUserRecord,
} from '@zkdb/common';
import Client from 'mina-signer';
import { ClientSession, InsertOneResult, WithoutId } from 'mongodb';
import { DEFAULT_PAGINATION } from '../../common/const.js';
import config from '../../helper/config.js';
import ModelUser from '../../model/global/user.js';
import { FilterCriteria } from '../utils/document.js';

export type TUserParamSignUp = {
  // Remove publicKey from TUser since TMinaSignature already have
  user: Omit<TUser, 'publicKey'>;
  signature: TMinaSignature;
};

export type TUserParamFindPagination = {
  query?: FilterCriteria;
  paginationInput?: TPagination;
};

export class User {
  public static async signUpUser(
    params: TUserParamSignUp
  ): Promise<WithoutId<TUserRecord>> {
    const {
      user: { userName, email, userData },
      signature,
    } = params;
    // Init client mina-signer
    const client = new Client({ network: config.NETWORK_ID });
    // Ensure the signature verified
    if (client.verifyMessage(signature)) {
      const jsonData: TUser = JSON.parse(signature.data);
      // Ensure the signature data match with user input data
      if (jsonData.userName !== userName) {
        throw new Error('Username does not match');
      }
      if (jsonData.email !== email) {
        throw new Error('Email does not match');
      }
      const modelUser = new ModelUser();

      // Check for existing user with conflicting data
      const existingUser = await modelUser.collection.findOne({
        $or: [{ email }, { userName }, { publicKey: signature.publicKey }],
      });

      // TODO: We need to consider the trade off of this approach
      // Better user friendly experience or security
      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error('A user with this email already exists');
        }
        if (existingUser.userName === userName) {
          throw new Error('A user with this username already exists');
        }
        if (existingUser.publicKey === signature.publicKey) {
          throw new Error('A user with this public key already exists');
        }
      }

      const createResult = await modelUser.create({
        email,
        userName,
        publicKey: signature.publicKey,
        userData,
      });
      // Get user after inserted
      const user = await modelUser.findOne({ _id: createResult.insertedId });

      if (user) {
        return user;
      }
      throw new Error('Unable to create new user');
    }
    throw new Error('Signature is not valid');
  }

  public static async findMany(
    params: TUserParamFindPagination,
    session?: ClientSession
  ): Promise<TPaginationReturn<TUser[]>> {
    const { query, paginationInput } = params;
    // Initialize model
    const modelUser = new ModelUser();

    const pagination = paginationInput || DEFAULT_PAGINATION;

    // Execute the query with pagination
    // Using promise.all to ensure all or nothing atomic result
    const [data, total] = await Promise.all([
      modelUser.find(query, { session }).toArray(),
      modelUser.count(query, { session }),
    ]);

    return {
      data,
      total,
      ...pagination,
    };
  }
}
