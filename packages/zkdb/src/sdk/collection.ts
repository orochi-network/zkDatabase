import {
  createDocument,
  createIndexes,
  deleteDocument,
  deleteIndex,
  findDocument,
  listIndexes,
  setOwner,
  updateDocument,
} from '@zkdb/api';
import { Filter, ZKCollection } from './interfaces/collection.js';
import { DocumentEncoded } from './schema.js';
import { Field } from 'o1js';
import { MerkleWitness } from '../types/merkle-tree.js';
import { Permissions } from '../types/permission.js';

export class ZKCollectionImpl<
  T extends {
    new (..._args: any): InstanceType<T>;
    deserialize: (_doc: DocumentEncoded) => any;
  },
> implements ZKCollection<T>
{
  private databaseName: string;
  private collectionName: string;
  private type: T;

  private constructor(databaseName: string, collectionName: string, type: T) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.type = type;
  }

  async findOne(filter: Filter<T>): Promise<InstanceType<T> | null> {
    const result = await findDocument(
      this.databaseName,
      this.collectionName,
      JSON.parse(JSON.stringify(filter))
    );

    if (result.type === 'success') {
      return new this.type(result.data.document);
    } else {
      return null;
    }
  }

  async deleteOne(filter: Partial<InstanceType<T>>): Promise<MerkleWitness> {
    const result = await deleteDocument(
      this.databaseName,
      this.collectionName,
      JSON.parse(JSON.stringify(filter))
    );

    if (result.type === 'success') {
      return result.data.map((node) => ({
        isLeft: node.isLeft,
        sibling: Field(node.sibling),
      }));
    } else {
      throw Error(result.message);
    }
  }

  async insertOneWithPermissions(
    model: InstanceType<T>,
    permissions: Permissions
  ): Promise<MerkleWitness> {
    const result = await createDocument(
      this.databaseName,
      this.collectionName,
      (model as any).serialize(),
      permissions
    );

    if (result.type === 'success') {
      return result.data.map((node) => ({
        isLeft: node.isLeft,
        sibling: Field(node.sibling),
      }));
    } else {
      throw Error(result.message);
    }
  }

  async insertOne(model: InstanceType<T>): Promise<MerkleWitness> {
    const result = await createDocument(
      this.databaseName,
      this.collectionName,
      (model as any).serialize(),
      {}
    );

    if (result.type === 'success') {
      return result.data.map((node) => ({
        isLeft: node.isLeft,
        sibling: Field(node.sibling),
      }));
    } else {
      throw Error(result.message);
    }
  }

  async updateOne(
    filter: Filter<T>,
    model: Partial<InstanceType<T>>
  ): Promise<MerkleWitness> {
    const result = await updateDocument(
      this.databaseName,
      this.collectionName,
      JSON.parse(JSON.stringify(filter)),
      (model as any).serialize()
    );

    if (result.type === 'success') {
      return result.data.map((node) => ({
        isLeft: node.isLeft,
        sibling: Field(node.sibling),
      }));
    } else {
      throw Error(result.message);
    }
  }

  public static loadCollection<
    T extends {
      new (..._args: any[]): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(
    databaseName: string,
    collectionName: string,
    type: T
  ): ZKCollectionImpl<T> {
    // TODO: Validate from server
    return new ZKCollectionImpl<T>(databaseName, collectionName, type);
  }

  async listIndexes(): Promise<string[]> {
    const result = await listIndexes(this.databaseName, this.collectionName);

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }

  async dropIndex(indexName: string): Promise<boolean> {
    const result = await deleteIndex(
      this.databaseName,
      this.collectionName,
      indexName
    );

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }

  async createIndex(indexName: string): Promise<boolean> {
    const result = await createIndexes(this.databaseName, this.collectionName, [
      indexName,
    ]);

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }

  async createIndexes(indexNames: string[]): Promise<boolean> {
    const result = await createIndexes(
      this.databaseName,
      this.collectionName,
      indexNames
    );

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }

  changePermissions(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async changeGroup(userName: string): Promise<void> {
    const result = await setOwner(
      this.databaseName,
      this.collectionName,
      undefined,
      'User',
      userName
    );

    if (result.type === 'error') {
      throw Error(result.message);
    }
  }

  async changeOwner(groupName: string): Promise<void> {
    const result = await setOwner(
      this.databaseName,
      this.collectionName,
      undefined,
      'Group',
      groupName
    );

    if (result.type === 'error') {
      throw Error(result.message);
    }
  }
}
