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

  async create(index: string[] | IndexField[]): Promise<boolean> {
    let indexField: IndexField[] = [];
    if (index.every((field) => typeof field === 'string')) {
      indexField = (index as string[]).map((field) => ({
        name: field,
        sorting: 'ASC',
      }));
    } else {
      indexField = index;
    }
    const result = await this.apiClient.index.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      indexes: indexField,
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
