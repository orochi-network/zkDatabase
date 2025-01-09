import { IApiClient } from '@zkdb/api';
import {
  TCollectionMetadata,
  TDocumentCreateResponse,
  TPagination,
  TPaginationReturn,
  TSchemaExtendable,
} from '@zkdb/common';
import { Permission } from '@zkdb/permission';
import {
  ICollection,
  ICollectionIndex,
  IDocument,
  IMetadata,
} from '../interfaces';
import { CollectionIndex } from './collection-index';
import { CollectionMetadata } from './collection-metadata';
import { Document } from './document';

export class Collection<T extends TSchemaExtendable<any>>
  implements ICollection<T>
{
  private apiClient: IApiClient;

  private databaseName: string;

  private collectionName: string;

  private get basicRequest() {
    return {
      databaseName: this.databaseName,
      collectionName: this.collectionName,
    };
  }

  constructor(
    apiClient: IApiClient,
    databaseName: string,
    collectionName: string
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.apiClient = apiClient;
  }

  get index(): ICollectionIndex {
    return new CollectionIndex(
      this.apiClient,
      this.databaseName,
      this.collectionName
    );
  }

  get metadata(): IMetadata<TCollectionMetadata> {
    return new CollectionMetadata(
      this.apiClient,
      this.databaseName,
      this.collectionName
    );
  }

  async exist(): Promise<boolean> {
    return (
      await this.apiClient.collection.collectionExist(this.basicRequest)
    ).unwrap();
  }

  async create(
    schema: T,
    permission?: Permission,
    groupName?: string
  ): Promise<boolean> {
    return (
      await this.apiClient.collection.collectionCreate({
        ...this.basicRequest,
        schema: schema ? schema.getSchemaDefinition() : undefined,
        permission: permission ? permission.value : undefined,
        groupName,
      })
    ).unwrap();
  }

  async findOne(
    filter: Partial<T['innerStructure']>
  ): Promise<IDocument<T> | null> {
    const result = await this.apiClient.document.documentFind({
      ...this.basicRequest,
      query: filter as any,
      pagination: { limit: 1, offset: 0 },
    });

    if (result.isValid()) {
      const {
        data: [record],
        total,
      } = result.unwrap();
      if (record && total === 1) {
        return new Document(
          this.apiClient,
          this.databaseName,
          this.collectionName,
          record
        );
      }
    }
    return null;
  }

  async findMany(
    filter?: Partial<T['innerStructure']> | undefined,
    pagination?: TPagination
  ): Promise<TPaginationReturn<IDocument<T>[]>> {
    const result = await this.apiClient.document.documentFind({
      ...this.basicRequest,
      query: filter as any,
      pagination,
    });

    if (result.isValid()) {
      const { data, offset, total } = result.unwrap();
      return {
        data: data.map(
          (e) =>
            new Document(
              this.apiClient,
              this.databaseName,
              this.collectionName,
              e
            )
        ),
        offset,
        total,
      };
    }
    throw new Error('Failed to find documents');
  }

  async insert(
    document: T['innerStructure']
  ): Promise<TDocumentCreateResponse> {
    return (
      await this.apiClient.document.documentCreate({
        ...this.basicRequest,
        document,
      })
    ).unwrap();
  }
}
