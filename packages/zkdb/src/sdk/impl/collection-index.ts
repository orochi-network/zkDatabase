/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { IApiClient } from '@zkdb/api';
import { IndexField } from '../../types/collection-index';
import { ZKCollectionIndex } from '../interfaces';

export class CollectionIndexImpl implements ZKCollectionIndex {
  private databaseName: string;
  private collectionName: string;
  private apiClient: IApiClient;

  constructor(
    databaseName: string,
    collectionName: string,
    apiClient: IApiClient
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.apiClient = apiClient;
  }

  async list(): Promise<string[]> {
    const result = await this.apiClient.index.list({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
    });

    return result.unwrap();
  }

  async create(indexes: IndexField[]): Promise<boolean> {
    const result = await this.apiClient.index.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      indexes: indexes.map(({ name, sorting }) => ({
        name,
        sorting: sorting === 'asc' ? 'ASC' : 'DESC',
      })),
    });

    return result.unwrap();
  }

  async drop(indexName: string): Promise<boolean> {
    const result = await this.apiClient.index.delete({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      indexName,
    });

    return result.unwrap();
  }
}
