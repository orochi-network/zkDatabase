/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { MerkleWitness } from '../../types/merkle-tree.js';
import { ZKCollection } from '../interfaces/collection.js';
import { ZKDocument } from '../interfaces/document.js';
import { Filter } from '../../types/filter.js';
import { ZKDocumentImpl } from './document.js';
import { DocumentEncoded, ProvableTypeString } from '../schema.js';
import { Permissions } from '../../types/permission.js';
import { Ownership } from '../../types/ownership.js';
import { Pagination } from '../../types/pagination.js';
import { IApiClient } from '@zkdb/api';
import { Field } from 'o1js';

export class CollectionQueryImpl implements ZKCollection {
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

  async listIndexes(): Promise<string[]> {
    const result = await this.apiClient.index.list({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
    });

    return result.unwrap();
  }

  async createIndexes(indexes: string[]): Promise<boolean> {
    const result = await this.apiClient.index.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      indexes,
    });

    return result.unwrap();
  }

  async dropIndex(indexName: string): Promise<boolean> {
    const result = await this.apiClient.index.delete({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      indexName,
    });

    return result.unwrap();
  }

  async fetchMany<T extends { new (..._args: any): InstanceType<T> }>(
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

  async fetchOne<T extends { new (..._args: any): InstanceType<T> }>(
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

  async delete<T extends { new (..._args: any): InstanceType<T> }>(
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
    const documentPermission =
      permissions ?? (await this.getOwnership());

    const result = await this.apiClient.doc.create({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentRecord: (model as any).serialize(),
      documentPermission: {
        permissionOwner: documentPermission.permissionOwner,
        permissionOther: documentPermission.permissionOther,
        permissionGroup: documentPermission.permissionGroup
      },
    });

    const merkleWitness = result.unwrap();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
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

  async setPermissions(permissions: Permissions): Promise<Ownership> {
    const remotePermissions = await this.getOwnership();

    const result = await this.apiClient.permission.set({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
      permission: {
        permissionOwner: {
          ...remotePermissions.permissionOwner,
          ...permissions.permissionOwner,
        },
        permissionGroup: {
          ...remotePermissions.permissionGroup,
          ...permissions.permissionGroup,
        },
        permissionOther: {
          ...remotePermissions.permissionOther,
          ...permissions.permissionOther,
        },
      },
    });

    return result.unwrap()
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
