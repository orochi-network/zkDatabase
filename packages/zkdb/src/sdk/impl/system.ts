/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { PublicKey } from 'o1js';
import { IApiClient } from '@zkdb/api';
import { ZKSystem } from '../interfaces/system';
import { User, Database, FilterCriteria, Pagination } from '../../types';

export class ZKSystemImpl implements ZKSystem {
  private apiClient: IApiClient;

  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }

  async listDatabase(
    filter: FilterCriteria = {},
    pagination: Pagination = { offset: 0, limit: 10 }
  ): Promise<Database[]> {
    const result = await this.apiClient.db.list({
      query: filter,
      pagination,
    });

    return result
      .unwrap()
      .map(({ databaseName, merkleHeight, collections, databaseSize }) => ({
        databaseName,
        merkleHeight,
        collections: collections.map(({ name }) => name),
        databaseSize,
      }));
  }

  async listUser(
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
}
