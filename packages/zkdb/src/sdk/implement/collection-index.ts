import { IApiClient } from '@zkdb/api';
import { TCollectionIndex, TIndexListResponse } from '@zkdb/common';
import { ICollectionIndex } from '../interfaces';

export class CollectionIndex implements ICollectionIndex {
  private databaseName: string;

  private collectionName: string;

  private apiClient: IApiClient;

  constructor(
    apiClient: IApiClient,
    databaseName: string,
    collectionName: string
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.apiClient = apiClient;
  }

  private get basicRequest() {
    return {
      databaseName: this.databaseName,
      collectionName: this.collectionName,
    };
  }

  async list(): Promise<TIndexListResponse> {
    return (await this.apiClient.index.indexList(this.basicRequest)).unwrap();
  }

  async create(index: TCollectionIndex[]): Promise<boolean> {
    return (
      await this.apiClient.index.indexCreate({
        ...this.basicRequest,
        index,
      })
    ).unwrap();
  }

  async drop(indexName: string): Promise<boolean> {
    return (
      await this.apiClient.index.indexDrop({
        ...this.basicRequest,
        indexName,
      })
    ).unwrap();
  }
}
