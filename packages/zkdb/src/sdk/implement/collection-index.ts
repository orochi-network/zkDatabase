import { IApiClient } from '@zkdb/api';
import { TCollectionIndex } from '@zkdb/common';
import { ICollectionIndex } from '../interfaces';

export class CollectionIndex implements ICollectionIndex {
  private databaseName: string;

  private collectionName: string;

  private apiClient: IApiClient;

  async list(): Promise<TCollectionIndex[]> {
    const result = (
      await this.apiClient.index.indexList({
        databaseName: this.databaseName,
        collectionName: this.collectionName,
      })
    ).unwrap();
  }

  async create(index: TCollectionIndex): Promise<boolean> {
    return (
      await this.apiClient.index.indexCreate({
        databaseName: this.databaseName,
        collectionName: this.collectionName,
        index,
      })
    ).unwrap();
  }

  async drop(indexName: string): Promise<boolean> {
    return (
      await this.apiClient.index.indexDrop({
        databaseName: this.databaseName,
        collectionName: this.collectionName,
        indexName,
      })
    ).unwrap();
  }
  /*
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
  }*/
}
