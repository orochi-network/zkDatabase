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
  listPermissions,
  setOwnership,
  setPermission,
} from '../client/index.js';

export default class Document {
  private databaseName: string;
  private collectionName: string;

  private _id: string | undefined;

  get id() {
    return this._id
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
  >(filter: FilterCriteria, documentSchema: T): Promise<InstanceType<T> | null> {
    const document = (
      await readDocument(this.databaseName, this.collectionName, filter)
    ).findDocument;

    if (document === undefined) {
      return null;
    }
    // Set _id

    console.log('document', document)

    return new documentSchema(documentSchema.deserialize(document));
  }

  public async new<A extends Schema & { serialize: () => DocumentEncoded }>(
    documentInstance: A,
    permissions: Permissions = {}
  ): Promise<MerkleWitness> {
    return (
      await createDocument(
        this.databaseName,
        this.collectionName,
        documentInstance.serialize(),
        permissions
      )
    ).documentCreate.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async update<A extends Schema & { serialize: () => DocumentEncoded }>(
    documentInstance: A,
    filter: FilterCriteria
  ): Promise<MerkleWitness> {
    return (
      await updateDocument(
        this.databaseName,
        this.collectionName,
        filter,
        documentInstance.serialize()
      )
    ).documentUpdate.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async remove(filter: FilterCriteria): Promise<MerkleWitness> {
    return (
      await dropDocument(this.databaseName, this.collectionName, filter)
    ).merkleWitness.map((witness) => {
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
