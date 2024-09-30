import { logger } from '@helper';
import { ModelUser } from '@model';
import Client from 'mina-signer';
import { ClientSession } from 'mongodb';
import { Pagination, Signature, User } from '../types';
import { FilterCriteria, parseQuery } from '../utils';

// eslint-disable-next-line import/prefer-default-export
export async function findUser(
  query?: FilterCriteria,
  pagination?: Pagination,
  session?: ClientSession
): Promise<User[]> {
  const modelUser = new ModelUser();

  const options: any = {};
  if (pagination) {
    options.limit = pagination.limit;
    options.skip = pagination.offset;
  }

  return (
    await modelUser.find(query || {}, {
      session,
      ...options,
    })
  ).toArray();
}

export async function isUserExist(userName: string): Promise<boolean> {
  const modelUser = new ModelUser();

  return (await modelUser.find({ userName })) !== null;
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
      throw error; // Re-throw the error after logging
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
