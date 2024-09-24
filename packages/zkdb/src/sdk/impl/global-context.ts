/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { PublicKey } from 'o1js';
import { GlobalContext } from '../interfaces/global-context.js';
import { User } from '../../types/user.js';
import { Database } from '../../types/database.js';
import { FilterCriteria } from '../../types/common.js';
import { IApiClient } from '@zkdb/api';
import { Pagination } from '../../types/pagination.js';

export class GlobalContextImpl implements GlobalContext {
  private apiClient: IApiClient;

  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }

  async databases(
    filter?: FilterCriteria,
    pagination?: Pagination
  ): Promise<Database[]> {
    const result = await this.apiClient.db.list({
      query: filter ?? {},
      pagination: pagination ?? {
        offset: 0,
        limit: 10,
      },
    });

    return result.unwrap();
  }

  async users(
    filter?: FilterCriteria,
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

  async createDatabase(
    databaseName: string,
    merkleHeight: number,
    publicKey: PublicKey
  ): Promise<boolean> {
    const result = await this.apiClient.db.create({
      databaseName,
      merkleHeight,
      publicKey: publicKey.toBase58(),
    });

    return result.unwrap();
  }
}
