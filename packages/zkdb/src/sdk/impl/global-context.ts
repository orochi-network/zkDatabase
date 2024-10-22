/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { PublicKey } from 'o1js';
import { IApiClient } from '@zkdb/api';
import { GlobalContext } from '../interfaces';
import { User, Database, FilterCriteria, Pagination } from '../../types';
import { NetworkId } from '../../types/network';

export class GlobalContextImpl implements GlobalContext {
  private apiClient: IApiClient;
  private networkId: NetworkId;

  constructor(apiClient: IApiClient, networkId: NetworkId) {
    this.apiClient = apiClient;
    this.networkId = networkId;
  }

  async databases(
    filter: FilterCriteria = {},
    pagination: Pagination = { offset: 0, limit: 10 }
  ): Promise<Database[]> {
    const result = await this.apiClient.db.list({
      networkId: this.networkId,
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
      networkId: this.networkId
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
      networkId: this.networkId
    });

    return result.unwrap();
  }
}
