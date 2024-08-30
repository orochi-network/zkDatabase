/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { MerkleWitness } from '../../types/merkle-tree.js';
import {
  createDocument,
  deleteDocument,
  findDocument,
  findDocuments,
  updateDocument,
} from '../../repository/document.js';
import { ZKCollection } from '../interfaces/collection.js';
import { ZKDocument } from '../interfaces/document.js';
import { QueryOptions } from '../query/query-builder.js';
import { Filter } from '../../types/filter.js';
import { ZKDocumentImpl } from './document.js';
import { DocumentEncoded } from '../schema.js';
import {
  getCollectionOwnership,
  setCollectionPermissions,
  updateCollectionGroupOwnership,
} from '../../repository/ownership.js';
import { Permissions } from '../../types/permission.js';
import { Ownership } from '../../types/ownership.js';
import { getDocumentHistory as getDocumentHistoryRequest } from '../../repository/document-history.js';
import { Pagination } from '../../types/pagination.js';

export class CollectionQueryImpl implements ZKCollection {
  private databaseName: string;
  private collectionName: string;

  constructor(databaseName: string, collectionName: string) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
  }

  async getAvailableDocuments<
    T extends { new (..._args: any): InstanceType<T> },
  >(filter?: Filter<T>, pagination?: Pagination): Promise<ZKDocument[]> {
    return (
      await findDocuments(
        this.databaseName,
        this.collectionName,
        filter ?? {},
        pagination
      )
    ).map((document) => {
      return new ZKDocumentImpl(
        this.databaseName,
        this.collectionName,
        document
      );
    });
  }

  async getDocument<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>
  ): Promise<ZKDocument | null> {
    const document = await findDocument(
      this.databaseName,
      this.collectionName,
      filter
    );
    if (document) {
      return new ZKDocumentImpl(
        this.databaseName,
        this.collectionName,
        document
      );
    }
    return null;
  }

  async updateDocument<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>,
    model: InstanceType<T>
  ): Promise<MerkleWitness> {
    return updateDocument(
      this.databaseName,
      this.collectionName,
      (model as any).serialize(),
      filter
    );
  }

  async deleteDocument<T extends { new (..._args: any): InstanceType<T> }>(
    filter: Filter<T>
  ): Promise<MerkleWitness> {
    return deleteDocument(this.databaseName, this.collectionName, filter);
  }

  saveDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(model: InstanceType<T>, permissions: Permissions): Promise<MerkleWitness>;

  saveDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(model: InstanceType<T>): Promise<MerkleWitness>;

  async saveDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(model: InstanceType<T>, permissions?: Permissions): Promise<MerkleWitness> {
    if (permissions) {
      return createDocument(
        this.databaseName,
        this.collectionName,
        (model as any).serialize(),
        permissions
      );
    } else {
      const ownership = await this.getOwnership();
      return createDocument(
        this.databaseName,
        this.collectionName,
        (model as any).serialize(),
        ownership.permissions
      );
    }
  }

  async changeGroup(groupName: string): Promise<void> {
    return updateCollectionGroupOwnership(
      this.databaseName,
      this.collectionName,
      groupName
    );
  }

  async changeOwner(userName: string): Promise<void> {
    return updateCollectionGroupOwnership(
      this.databaseName,
      this.collectionName,
      userName
    );
  }

  async setPermissions(permissions: Permissions): Promise<Permissions> {
    return setCollectionPermissions(
      this.databaseName,
      this.collectionName,
      permissions
    );
  }

  async getOwnership(): Promise<Ownership> {
    return getCollectionOwnership(this.databaseName, this.collectionName);
  }

  async getDocumentHistory(documentId: string): Promise<ZKDocument[]> {
    return (
      await getDocumentHistoryRequest(
        this.databaseName,
        this.collectionName,
        documentId
      )
    ).documents.map(
      (document) =>
        new ZKDocumentImpl(this.databaseName, this.collectionName, document)
    );
  }
}
