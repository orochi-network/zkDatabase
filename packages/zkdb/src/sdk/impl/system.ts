/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { IApiClient } from '@zkdb/api';
import { Database, FilterCriteria, Pagination, User } from '../../types';
import { ZKSystem } from '../interfaces/system';

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
