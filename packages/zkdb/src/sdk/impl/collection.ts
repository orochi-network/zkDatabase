/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { IApiClient } from '@zkdb/api';
import { Permission } from '@zkdb/permission';
import { Field } from 'o1js';
import {
  Filter,
  IndexField,
  MerkleWitness,
  OwnershipAndPermission,
  Pagination,
} from '../../types';
import {
  Ownable,
  ZKCollection,
  ZKCollectionIndex,
  ZKDocument,
} from '../interfaces';
import {
  DocumentEncoded,
  ProvableTypeString,
  ISchemaExtend,
  SchemaInterface,
} from '../schema';
import { CollectionIndexImpl } from './collection-index';
import { ZKDocumentImpl } from './document';

class CollectionOwnership implements Ownable {
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
  }
}

export class CollectionImpl implements ZKCollection {
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

  get index(): ZKCollectionIndex {
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
  }
}
