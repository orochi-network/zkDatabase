import { DEFAULT_PAGINATION } from '@common';
import { config } from '@helper';
import { ModelUser } from '@model';
import {
  TPaginationReturn,
  TParamPagination,
  TUser,
  TUserParamSignUp,
  TUserRecord,
} from '@zkdb/common';
import Client from 'mina-signer';
import { ClientSession, WithoutId } from 'mongodb';
import { NetworkId } from 'o1js';

export class User {
  public static async signUp(
    paramSignUp: TUserParamSignUp
  ): Promise<WithoutId<TUserRecord>> {
    const {
      user: { userName, email, userData },
      signature,
    } = paramSignUp;

    // Init client mina-signer
    const client = new Client({
      // Since NETWORK_ID enum return {Testnet, Mainnet} so we need to lowercase and cast
      network: config.NETWORK_ID.toLowerCase() as NetworkId,
    });
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
      const imUser = new ModelUser();

      // Check for existing user with conflicting data
      const existingUser = await imUser.collection.findOne({
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

      const createResult = await imUser.insertOne({
        email,
        userName,
        publicKey: signature.publicKey,
        userData,
        activated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // Get user after inserted
      const user = await imUser.findOne({ _id: createResult.insertedId });

      if (user) {
        return user;
      }
      throw new Error('Unable to create new user');
    }
    throw new Error('Signature is not valid');
  }

  public static async findMany(
    paramUserPagination: TParamPagination<Omit<TUser, 'userData'>>,
    session?: ClientSession
  ): Promise<TPaginationReturn<TUser[]>> {
    const { query, paginationInput } = paramUserPagination;
    // Initialize model
    const imUser = new ModelUser();

    const pagination = paginationInput || DEFAULT_PAGINATION;

    // Execute the query with pagination
    // Using promise.all to ensure all or nothing atomic result
    const [data, total] = await Promise.all([
      imUser.find(query, { session }).toArray(),
      imUser.count(query, { session }),
    ]);

    return {
      data,
      total,
      ...pagination,
    };
  }
}
