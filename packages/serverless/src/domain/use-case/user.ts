import Client from 'mina-signer';
import { ClientSession, FindOptions } from 'mongodb';
import config from '../../helper/config.js';
import logger from '../../helper/logger.js';
import ModelUser from '../../model/global/user.js';
import {
  TMinaSignature,
  TPagination,
  TPaginationReturn,
  TUser,
} from '../../types/index.js';
import { FilterCriteria } from '../utils/document.js';

export async function findUser(
  query?: FilterCriteria,
  pagination?: TPagination,
  session?: ClientSession
): Promise<TPaginationReturn<TUser[]>> {
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
    totalSize: await modelUser.count(query, { session }),
  };
}

export async function isUserExist(userName: string): Promise<boolean> {
  const modelUser = new ModelUser();
  return (await modelUser.findOne({ userName })) !== null;
}

export async function signUpUser(
  user: TUser,
  userData: any,
  signature: TMinaSignature
) {
  const client = new Client({ network: config.NETWORK_ID });
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
