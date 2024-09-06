import { DocumentEncoded } from '../schema.js';
import { MerkleWitness } from '../../types/merkle-tree.js';
import { getWitnessByDocumentId } from '../../repository/merkle-tree.js';
import { ZKDocument } from '../interfaces/document.js';
import { Ownership } from '../../types/ownership.js';
import { Permissions } from '../../types/permission.js';
import {
  getDocumentOwnership,
  updateDocumentGroupOwnership,
  updateDocumentUserOwnership,
  setDocumentPermissions,
} from '../../repository/ownership.js';
import { deleteDocument } from '../../repository/document.js';
import { Document } from '../../types/document.js';
import { ProofStatus } from '../../types/proof.js';
import { getProofStatus } from '../../repository/proof.js';
import { getDocumentHistory as getDocumentHistoryRequest } from '../../repository/document-history.js';

export class ZKDocumentImpl implements ZKDocument {
  private databaseName: string;
  private collectionName: string;
  private _documentEncoded: DocumentEncoded;
  private _id: string;
  private createdAt: Date;

  constructor(
    databaseName: string,
    collectionName: string,
    document: Document
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this._documentEncoded = document.documentEncoded;
    this._id = document.id;
    this.createdAt = document.createdAt;
  }

  async getProofStatus(): Promise<ProofStatus> {
    return getProofStatus(this.databaseName, this.collectionName, this._id);
  }

  async changeGroup(groupName: string): Promise<void> {
    return updateDocumentGroupOwnership(
      this.databaseName,
      this.collectionName,
      this._id,
      groupName
    );
  }

  async changeOwner(userName: string): Promise<void> {
    return updateDocumentUserOwnership(
      this.databaseName,
      this.collectionName,
      this._id,
      userName
    );
  }

  async setPermissions(permissions: Permissions): Promise<Permissions> {
    return setDocumentPermissions(
      this.databaseName,
      this.collectionName,
      this._id,
      permissions
    );
  }

  async getOwnership(): Promise<Ownership> {
    return getDocumentOwnership(
      this.databaseName,
      this.collectionName,
      this._id
    );
  }

  async getWitness(): Promise<MerkleWitness> {
    if (this._id) {
      return getWitnessByDocumentId(this.databaseName, this._id);
    }
    throw Error();
  }

  toSchema<
    T extends {
      new (..._args: any): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(type: T): InstanceType<T> {
    if (this._documentEncoded.length > 0) {
      return type.deserialize(this._documentEncoded);
    }
    throw Error();
  }

  public getId(): string {
    return this._id;
  }

  public getDocumentEncoded(): DocumentEncoded {
    return this._documentEncoded;
  }

  async delete(): Promise<MerkleWitness> {
    return deleteDocument(this.databaseName, this.collectionName, {
      docId: this._id,
    });
  }

  async getDocumentHistory(): Promise<ZKDocument[]> {
    return (
      await getDocumentHistoryRequest(
        this.databaseName,
        this.collectionName,
        this._id
      )
    ).documents.map(
      (document) =>
        new ZKDocumentImpl(this.databaseName, this.collectionName, document)
    );
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
