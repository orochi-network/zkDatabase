import {
  EIndexProperty,
  ESorting,
  Schema,
  TCollectionMetadata,
  TMerkleProof,
  TPagination,
  TPaginationReturn,
  TSchemaExtendable,
} from '@zkdb/common';
import { Permission } from '@zkdb/permission';
import { CircuitString, UInt32 } from 'o1js';
import {
  ICollection,
  ICollectionIndex,
  IDocument,
  IMetadata,
} from '../interfaces';
import { IApiClient } from '@zkdb/api';

class CollectionMetadata implements IMetadata<TCollectionMetadata> {
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

  async changeGroup(groupName: string): Promise<void> {
    const result = await this.apiClient.ownership.setOwnership({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
      grouping: 'Group',
      newOwner: groupName,
    });

    result.unwrap();
  }

  async changeOwner(userName: string): Promise<void> {
    const result = await this.apiClient.ownership.setOwnership({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
      grouping: 'User',
      newOwner: userName,
    });

    result.unwrap();
  }

  async setPermission(permission: Permission): Promise<OwnershipAndPermission> {
    const result = await this.apiClient.permission.set({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
      permission: permission.value,
    });

    const {
      groupName,
      userName,
      permission: permissionDetail,
    } = result.unwrap();
    return {
      groupName,
      userName,
      ...Permission.from(permissionDetail).toJSON(),
    };
  }

  async getPermission(): Promise<OwnershipAndPermission> {
    const result = await this.apiClient.permission.get({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
    });

    const {
      groupName,
      userName,
      permission: permissionDetail,
    } = result.unwrap();
    return {
      groupName,
      userName,
      ...Permission.from(permissionDetail).toJSON(),
    };
  }*/
}

export class Collection<T extends TSchemaExtendable<any>>
  implements ICollection<T>
{
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

  get index(): ICollectionIndex {
    throw new Error('Method not implemented.');
  }
  get metadata(): IMetadata<TCollectionMetadata> {
    throw new Error('Method not implemented.');
  }
  exist(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  create(
    schema: T,
    index?: string[] | Partial<Record<keyof T, ESorting>>[] | undefined,
    permission?: Permission,
    groupName?: string
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  findOne(filter: Partial<T['innerStructure']>): Promise<IDocument<T> | null> {
    throw new Error('Method not implemented.');
  }
  findMany(
    filter?: Partial<T['innerStructure']> | undefined,
    pagination?: TPagination
  ): Promise<TPaginationReturn<IDocument<T>[]>> {
    throw new Error('Method not implemented.');
  }
  insert(document: T['innerStructure']): Promise<TMerkleProof> {
    throw new Error('Method not implemented.');
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

  get ownership(): Ownable {
    return new CollectionOwnership(
      this.databaseName,
      this.collectionName,
      this.apiClient
    );
  }

  get index(): ICollectionIndex {
    return new CollectionIndexImpl(
      this.databaseName,
      this.collectionName,
      this.apiClient
    );
  }

  async exist(): Promise<boolean> {
    const result = await this.apiClient.collection.exist({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
    });

    return result.unwrap();
  }

  async create<T extends SchemaInterface>(
    type: T,
    index?: IndexField[],
    permission?: Permission,
    groupName?: string
  ): Promise<boolean> {
    let indexField: IndexField[] | undefined = undefined;
    if (typeof index != 'undefined') {
      if (index.every((field) => typeof field === 'string')) {
        indexField = (index as string[]).map((field) => ({
          name: field,
          sorting: 'ASC',
        }));
      } else {
        indexField = index;
      }
    }
    const result = await this.apiClient.collection.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      groupName,
      schema: type.getSchema(),
      index: indexField,
      permission: permission
        ? permission.value
        : Permission.policyPrivate().value,
    });

    return result.unwrap();
  }

  async findMany<T extends { new (..._args: any): InstanceType<T> }>(
    filter?: Filter<T>,
    pagination?: Pagination
  ): Promise<ZKDocument[]> {
    const result = await this.apiClient.doc.findMany({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentQuery: filter,
      pagination,
    });

    const documents = result.unwrap();

    return documents.map((document) => {
      return new ZKDocumentImpl(
        this.databaseName,
        this.collectionName,
        {
          id: document.docId,
          documentEncoded: document.field as DocumentEncoded,
          createdAt: document.createdAt,
        },
        this.apiClient
      );
    });
  }

  async findOne<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>
  ): Promise<ZKDocument | null> {
    const result = await this.apiClient.doc.findOne({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentQuery: filter,
    });

    const document = result.unwrap();

    return new ZKDocumentImpl(
      this.databaseName,
      this.collectionName,
      {
        id: document.docId,
        documentEncoded: document.field as DocumentEncoded,
        createdAt: document.createdAt,
      },
      this.apiClient
    );
  }

  async update<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>,
    model: InstanceType<T>
  ): Promise<MerkleWitness> {
    const result = await this.apiClient.doc.update({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentQuery: filter,
      documentRecord: (model as any).serialize(),
    });

    const merkleWitness = result.unwrap();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  }

  async drop<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>
  ): Promise<MerkleWitness> {
    const result = await this.apiClient.doc.delete({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentQuery: filter,
    });

    const merkleWitness = result.unwrap();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  }

  insert<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(model: InstanceType<T>, permission: Permission): Promise<MerkleWitness>;

  insert<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(model: InstanceType<T>): Promise<MerkleWitness>;

  async insert<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    model: InstanceType<T> & ISchemaExtend,
    permission?: Permission
  ): Promise<MerkleWitness> {
    const result = await this.apiClient.doc.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentRecord: model.serialize(),
      documentPermission: permission ? permission.value : undefined,
    });

    const merkleWitness = result.unwrap();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  }*/
}

const MySchema = Schema.create({
  name: CircuitString,
  age: UInt32,
});

export type MySchemaType = typeof MySchema;

let col = new Collection<MySchemaType>();

col.create(MySchema, ['name'], Permission.policyPrivate());

await col.findOne({ name: 'John', age: 3 });
