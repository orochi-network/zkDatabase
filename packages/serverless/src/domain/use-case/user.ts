import Client from 'mina-signer';
import { ClientSession, FindOptions } from 'mongodb';
import logger from '../../helper/logger.js';
import ModelUser from '../../model/global/user.js';
import { Pagination, PaginationReturn } from '../types/pagination.js';
import { Signature } from '../types/proof.js';
import { User } from '../types/user.js';
import { FilterCriteria } from '../utils/document.js';
import { objectToLookupPattern } from '../../helper/common.js';

export async function searchUser(
  query: { [key: string]: string },
  pagination?: Pagination
): Promise<PaginationReturn<User[]>> {
  const modelUser = new ModelUser();

  const filter = {
    $or: objectToLookupPattern(query, { regexSearch: true }),
  }

  const findUsers = await modelUser.collection
    .find(
      filter,
      pagination
    )
    .toArray();

  return {
    data: findUsers,
    offset: pagination?.offset ?? 0,
    totalSize: await modelUser.count(filter)
  }
}

export async function findUser(
  query?: FilterCriteria,
  pagination?: Pagination,
  session?: ClientSession
): Promise<PaginationReturn<User[]>> {
  const modelUser = new ModelUser();

  const options: FindOptions = {};
  if (pagination) {
    options.limit = pagination.limit;
    options.skip = pagination.offset;
  }

  return {
    data: await (
      await modelUser.find(query || {}, {
        session,
        ...options,
      })
    ).toArray(),
    offset: pagination?.offset ?? 0,
    totalSize: await modelUser.count(query),
  };
}

export async function isUserExist(userName: string): Promise<boolean> {
  const modelUser = new ModelUser();
  return (await modelUser.findOne({ userName })) !== null;
}

export async function areUsersExist(userNames: string[]) {
  const modelUser = new ModelUser();

  return modelUser.areUsersExist(userNames);
}

export async function signUpUser(
  user: User,
  userData: any,
  signature: Signature
) {
  // @todo: We should move network config to ENV
  const client = new Client({ network: 'mainnet' });
  if (client.verifyMessage(signature)) {
    const jsonData = JSON.parse(signature.data);
    if (jsonData.userName !== user.userName) {
      throw new Error('Username does not match');
    }
    if (jsonData.email !== user.email) {
      throw new Error('Email does not match');
    }
    const modelUser = new ModelUser();

    try {
      const existingUser = await modelUser.collection.findOne({
        $or: [
          { email: user.email },
          { userName: user.userName },
          { publicKey: user.publicKey },
        ],
      });

      if (existingUser) {
        if (existingUser.email === user.email) {
          throw new Error('A user with this email already exists');
        }
        if (existingUser.userName === user.userName) {
          throw new Error('A user with this username already exists');
        }
        if (existingUser.publicKey === user.publicKey) {
          throw new Error('A user with this public key already exists');
        }
      }
    } catch (error) {
      logger.error('Error checking existing user:', error);
      throw error;
    }

    // TODO: Check user existence by public key
    const result = await modelUser.create(
      user.userName,
      user.email,
      user.publicKey,
      userData.userData
    );
    if (result && result.acknowledged) {
      return user;
    }

    // TODO: Return more meaningful error
    throw new Error('Unable to create new user');
  }
  throw new Error('Signature is not valid');
}
