import { IApiClient, TProofStatus } from '@zkdb/api';
import { Field } from 'o1js';
import {
  Document,
  MerkleWitness,
  Ownership,
  Permissions,
  ProofStatus,
} from '../../types';
import { Ownable, ZKDocument } from '../interfaces';
import { DocumentEncoded, ProvableTypeString } from '../schema';

class DocumentOwnerShip implements Ownable {
  private databaseName: string;
  private collectionName: string;
  private _id: string;
  private apiClient: IApiClient;

  constructor(
    databaseName: string,
    collectionName: string,
    document: ZKDocument,
    apiClient: IApiClient
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this._id = document.id;
    this.apiClient = apiClient;
  }

  async changeGroup(groupName: string): Promise<void> {
    const result = await this.apiClient.ownership.setOwnership({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: this._id,
      grouping: 'Group',
      newOwner: groupName,
    });

    result.unwrap();
  }

  async changeOwner(userName: string): Promise<void> {
    const result = await this.apiClient.ownership.setOwnership({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: this._id,
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
      docId: this._id,
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

    return result.unwrap();
  }

  async getOwnership(): Promise<Ownership> {
    const result = await this.apiClient.permission.get({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: this._id,
    });

    return result.unwrap();
  }
}

export class ZKDocumentImpl implements ZKDocument {
  private databaseName: string;
  private collectionName: string;
  private _documentEncoded: DocumentEncoded;
  private _id: string;
  private _createdAt: Date;
  private apiClient: IApiClient;

  get id(): string {
    return this._id;
  }

  get encoded(): DocumentEncoded {
    return this._documentEncoded;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get ownership(): Ownable {
    return new DocumentOwnerShip(
      this.databaseName,
      this.collectionName,
      this,
      this.apiClient
    );
  }

  constructor(
    databaseName: string,
    collectionName: string,
    document: Document,
    apiClient: IApiClient
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this._documentEncoded = document.documentEncoded;
    this._id = document.id;
    this._createdAt = document.createdAt;
    this.apiClient = apiClient;
  }

  async getProofStatus(): Promise<ProofStatus> {
    const result = await this.apiClient.proof.status({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: this._id,
    });
    switch (result.unwrap()) {
      case TProofStatus.QUEUED:
        return 'queue';
      case TProofStatus.PROVING:
        return 'proving';
      case TProofStatus.PROVED:
        return 'proved';
      case TProofStatus.FAILED:
        return 'failed';
    }
  }

  async getWitness(): Promise<MerkleWitness> {
    const result = await this.apiClient.merkle.witness({
      databaseName: this.databaseName,
      docId: this._id,
    });

    return result.unwrap().map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
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

  async drop(): Promise<MerkleWitness> {
    const result = await this.apiClient.doc.delete({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      documentQuery: JSON.parse(JSON.stringify({ docId: this._id })),
    });

    const merkleWitness = result.unwrap();

    return merkleWitness.map((node) => ({
      isLeft: node.isLeft,
      sibling: Field(node.sibling),
    }));
  }

  async getDocumentHistory(): Promise<ZKDocument[]> {
    const result = await this.apiClient.doc.history({
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: this._id,
    });

    return result.unwrap().documents.map(
      (document) =>
        new ZKDocumentImpl(
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
        )
    );
  }
}
