import { Field } from 'o1js';
import {
  createDocument,
  dropDocument,
  readDocument,
  updateDocument,
} from '../client/requests/document.js';
import { FilterCriteria } from '../types/common.js';
import { DocumentEncoded, Schema } from './schema.js';
import { PermissionGroup, Permissions } from '../types/permission.js';
import { MerkleWitness } from '../types/merkle-tree.js';
import { PermissionRecord } from '../common/permission.js';
import {
  getWitnessByDocumentId,
  listPermissions,
  setOwnership,
  setPermission,
} from '../client/index.js';

export default class Document {
  private databaseName: string;
  private collectionName: string;

  private _id: string | undefined;

  get id() {
    return this._id;
  }

  constructor(
    databaseName: string,
    collectionName: string,
    _id: string | undefined = undefined
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this._id = _id;
  }

  public async get<
    T extends {
      new (..._args: any): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(
    filter: FilterCriteria,
    documentSchema: T
  ): Promise<InstanceType<T> | null> {
    const response = await readDocument(
      this.databaseName,
      this.collectionName,
      filter
    );
    
    if (Object.keys(response).length === 0) {
      return null;
    }

    if (response.document === undefined) {
      return null;
    }

    this._id = response._id;

    return new documentSchema(documentSchema.deserialize(response.document));
  }

  public async new<A extends Schema & { serialize: () => DocumentEncoded }>(
    documentInstance: A,
    permissions: Permissions = {}
  ): Promise<MerkleWitness> {
    try {
      const response = await createDocument(
        this.databaseName,
        this.collectionName,
        documentInstance.serialize(),
        permissions
      );

      if (!response || !response.witness) {
        throw new Error('Invalid or missing witness data');
      }

      return response.witness.map((witness) => {
        return {
          isLeft: witness.isLeft,
          sibling: Field(witness.sibling),
        };
      });
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
    }
  }

  public async findAndUpdate<
    A extends Schema & { serialize: () => DocumentEncoded },
  >(documentInstance: A, filter: FilterCriteria): Promise<MerkleWitness> {
    return (
      await updateDocument(
        this.databaseName,
        this.collectionName,
        filter as any,
        documentInstance.serialize()
      )
    ).witness.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async update<A extends Schema & { serialize: () => DocumentEncoded }>(
    documentInstance: A
  ): Promise<MerkleWitness> {
    if (this.isEmpty()) {
      throw Error('Document is not defined');
    }
    return (
      await updateDocument(
        this.databaseName,
        this.collectionName,
        { _id: this._id! } as any,
        documentInstance.serialize()
      )
    ).witness.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async remove(filter: FilterCriteria): Promise<MerkleWitness> {
    return (
      await dropDocument(this.databaseName, this.collectionName, filter as any)
    ).witness.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async getWitness(): Promise<MerkleWitness> {
    if (this.isEmpty()) {
      throw Error('The document is empty');
    }

    return (
      await getWitnessByDocumentId(this.databaseName, this._id!)
    ).witness.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async changePermission(
    group: PermissionGroup,
    newRecord: PermissionRecord
  ): Promise<Permissions> {
    if (this.isEmpty()) {
      throw new Error('Document is not defined');
    }

    const response = await setPermission(
      this.databaseName,
      this.collectionName,
      this._id!,
      group,
      newRecord
    );

    return response.permissions;
  }

  public async getPermissions(): Promise<Permissions> {
    if (this.isEmpty()) {
      throw new Error('Document is not defined');
    }
    const response = await listPermissions(
      this.databaseName,
      this.collectionName,
      this._id!
    );

    return response.permissions;
  }

  public isEmpty(): boolean {
    return this._id === undefined;
  }

  public async changeGroupOwnership(newOwner: string) {
    if (this.isEmpty()) {
      throw new Error('Document is not defined');
    }

    await setOwnership(
      this.databaseName,
      this.collectionName,
      this._id!,
      'User',
      newOwner
    );
  }

  public async changeUserOwnership(newGroup: string) {
    if (this.isEmpty()) {
      throw new Error('Document is not defined');
    }

    await setOwnership(
      this.databaseName,
      this.collectionName,
      this._id!,
      'Group',
      newGroup
    );
  }
}
