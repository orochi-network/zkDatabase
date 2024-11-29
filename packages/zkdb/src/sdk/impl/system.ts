/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { IApiClient, TUser } from '@zkdb/api';
import {
  Database,
  DatabaseRecord,
  FilterCriteria,
  Pagination,
  User,
} from '../../types';
import { ZKSystem } from '../interfaces/system';

export class ZKSystemImpl implements ZKSystem {
  private apiClient: IApiClient;

  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }

  async listDatabase(
    filter: Partial<DatabaseRecord> = {},
    pagination: Pagination = { offset: 0, limit: 10 }
  ): Promise<Database[]> {
    const result = await this.apiClient.db.list({
      query: filter,
      pagination,
    });

    return result
      .unwrap()
      .map(({ databaseName, merkleHeight, collection, databaseSize }) => ({
        databaseName,
        merkleHeight,
        collection: collection.map(({ name }) => name),
        databaseSize,
      }));
  }

  async listUser(
    filter?: Partial<TUser>,
    pagination?: Pagination
  ): Promise<User[]> {
    const result = await this.apiClient.user.findMany({
      query: filter ?? {},
      pagination: pagination ?? {
        limit: 10,
        offset: 0,
      },
    });

    return result.unwrap();
  }

  async getUser(filter: Partial<TUser>): Promise<User | undefined> {
    if (Object.keys(filter).length < 1) {
      throw new Error('Required at least one field for user');
    }
    const result = await this.apiClient.user.findMany({
      query: filter,
    });
    // Should early throw error when isMany first
    // If we do the isOne logic and throw error outside, case undefined or duplicate user will be override
    if (result.isMany()) {
      throw new Error('User cant be duplicated');
    }

    return result.unwrap()[0];
  }

  async userExist(filter: Partial<TUser>): Promise<boolean> {
    if (Object.keys(filter).length < 1) {
      throw new Error('Required at least one field for user');
    }
    const result = await this.apiClient.user.findMany({
      query: filter,
    });

    if (result.isValid() && result.length > 0) {
      return true;
    }

    throw new Error('User response is not valid');
  }
}
