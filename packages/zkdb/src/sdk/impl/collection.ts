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
} from '../../types';
import { ZKDocumentImpl } from './document';
import { DocumentEncoded, ProvableTypeString } from '../schema';
import { ZKCollection, ZKDocument } from '../interfaces';
import { NetworkId } from '../../types/network';

export class CollectionQueryImpl implements ZKCollection {
  private databaseName: string;
  private collectionName: string;
  private apiClient: IApiClient;
  private networkId: NetworkId;

  constructor(
    databaseName: string,
    collectionName: string,
    apiClient: IApiClient,
    networkId: NetworkId
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.apiClient = apiClient;
    this.networkId = networkId;
  }

  async listIndexes(): Promise<string[]> {
    const result = await this.apiClient.index.list({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      networkId: this.networkId
    });

    return result.unwrap();
  }

  async createIndexes(indexes: string[]): Promise<boolean> {
    const result = await this.apiClient.index.create({
      networkId: this.networkId,
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      indexes,
    });

    return result.unwrap();
  }

  async dropIndex(indexName: string): Promise<boolean> {
    const result = await this.apiClient.index.delete({
      networkId: this.networkId,
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
      networkId: this.networkId,
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
        this.apiClient,
        this.networkId
      );
    });
  }

  async fetchOne<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>
  ): Promise<ZKDocument | null> {
    const result = await this.apiClient.doc.findOne({
      networkId: this.networkId,
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
      this.apiClient,
      this.networkId
    );
  }

  async update<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>,
    model: InstanceType<T>
  ): Promise<MerkleWitness> {
    const result = await this.apiClient.doc.update({
      networkId: this.networkId,
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
      networkId: this.networkId,
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
      : await this.getOwnership();

    const result = await this.apiClient.doc.create({
      networkId: this.networkId,
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

  async changeGroup(groupName: string): Promise<void> {
    const result = await this.apiClient.ownership.setOwnership({
      networkId: this.networkId,
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
      networkId: this.networkId,
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
      networkId: this.networkId,
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
      permission,
    });

    return result.unwrap();
  }

  async getOwnership(): Promise<Ownership> {
    const result = await this.apiClient.permission.get({
      networkId: this.networkId,
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: undefined,
    });

    return result.unwrap();
  }
}
