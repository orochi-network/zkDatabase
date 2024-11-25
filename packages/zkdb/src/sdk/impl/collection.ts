/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { IApiClient } from '@zkdb/api';
import { Field } from 'o1js';
import {
  MerkleWitness,
  Filter,
  Permissions,
  Ownership,
  Pagination,
  IndexField,
} from '../../types';
import { ZKDocumentImpl } from './document';
import {
  DocumentEncoded,
  ProvableTypeString,
  SchemaDefinition,
} from '../schema';
import {
  Ownable,
  ZKCollection,
  ZKCollectionIndex,
  ZKDocument,
} from '../interfaces';
import { CollectionIndexImpl } from './collection-index';

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

  async setPermissions(permission: Permissions): Promise<Ownership> {
    const result = await this.apiClient.permission.set({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
      permission,
    });

    return result.unwrap();
  }

  async getOwnership(): Promise<Ownership> {
    const result = await this.apiClient.permission.get({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
    });

    return result.unwrap();
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

  async exists(): Promise<boolean> {
    const result = await this.apiClient.collection.exist({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
    });

    return result.unwrap();
  }

  async create<T extends { getSchema: () => SchemaDefinition }>(
    groupName: string,
    type: T,
    indexes: IndexField[],
    permissions: Permissions
  ): Promise<boolean> {
    const result = await this.apiClient.collection.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      groupName,
      schema: type.getSchema(),
      indexes: indexes.map(({ name, sorting }) => ({
        name,
        sorting: sorting === 'asc' ? 'ASC' : 'DESC',
      })),
      permissions,
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
          documentEncoded: document.fields.map((field) => ({
            name: field.name,
            kind: field.kind as ProvableTypeString,
            value: field.value,
          })),
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
        documentEncoded: document.fields.map((field) => ({
          name: field.name,
          kind: field.kind as ProvableTypeString,
          value: field.value,
        })),
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
  >(model: InstanceType<T>, permissions: Permissions): Promise<MerkleWitness>;

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
  >(model: InstanceType<T>, permissions?: Permissions): Promise<MerkleWitness> {
    const isPermissionPassed =
      permissions && Object.keys(permissions).length > 0;
    const documentPermission = isPermissionPassed
      ? permissions
      : await this.ownership.getOwnership();

    const result = await this.apiClient.doc.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentRecord: (model as any).serialize(),
      documentPermission: {
        permissionOwner: documentPermission.permissionOwner,
        permissionOther: documentPermission.permissionOther,
        permissionGroup: documentPermission.permissionGroup,
      },
    });

    const merkleWitness = result.unwrap();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  }
}
