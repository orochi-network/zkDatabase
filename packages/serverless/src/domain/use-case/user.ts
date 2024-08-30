import { ClientSession } from 'mongodb';
import Client from 'mina-signer';
import ModelUser from '../../model/global/user.js';
import buildMongoQuery from '../query/mongodb-filter.js';
import { Pagination } from '../types/pagination.js';
import { User } from '../types/user.js';
import { Signature } from '../types/proof.js';
import { FilterCriteria, parseQuery } from '../utils/document.js';

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
    await modelUser.find(query ? parseQuery(query) : {}, {
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
  const client = new Client({ network: 'testnet' });
  if (client.verifyMessage(signature)) {
    const jsonData = JSON.parse(signature.data);
    if (jsonData.userName !== user.userName) {
      throw new Error('Username does not match');
    }
    if (jsonData.email !== user.email) {
      throw new Error('Email does not match');
    }
    const modelUser = new ModelUser();
    // TODO: Check user existence by public key
    const result = await modelUser.create(
      user.userName,
      user.email,
      user.publicKey,
      userData.userData
    );
    if (result && result.acknowledged) {
      return {
        success: true,
        error: null,
        userName: user.userName,
        email: user.email,
        publicKey: user.publicKey,
      };
    }
    return {
      success: false,
      error: 'Cannot create user',
      userName: user.userName,
      email: user.email,
      publicKey: user.publicKey,
    };
  }
  throw new Error('Signature is not valid');
}
