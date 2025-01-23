import { IApiClient } from '@zkdb/api';
import { EOwnershipType, TDocumentMetadataResponse } from '@zkdb/common';
import { OwnershipAndPermission, Permission } from '@zkdb/permission';
import { IMetadata } from '../interfaces';

export class DocumentMetadata implements IMetadata<TDocumentMetadataResponse> {
  private apiClient: IApiClient;

  private databaseName: string;

  private collectionName: string;

  private docId: string;

  private get basicRequest() {
    return {
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: this.docId,
    };
  }

  constructor(
    apiClient: IApiClient,
    databaseName: string,
    collectionName: string,
    docId: string
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.docId = docId;
    this.apiClient = apiClient;
  }

  async info(): Promise<TDocumentMetadataResponse> {
    return (
      await this.apiClient.document.documentMetadata({
        databaseName: this.databaseName,
        collectionName: this.collectionName,
        docId: this.docId,
      })
    ).unwrap();
  }

  async groupSet(groupName: string): Promise<boolean> {
    return (
      await this.apiClient.permissionOwnership.ownershipTransfer({
        ...this.basicRequest,
        groupType: EOwnershipType.Group,
        newOwner: groupName,
      })
    ).unwrap();
  }

  async ownerSet(userName: string): Promise<boolean> {
    return (
      await this.apiClient.permissionOwnership.ownershipTransfer({
        ...this.basicRequest,
        groupType: EOwnershipType.User,
        newOwner: userName,
      })
    ).unwrap();
  }

  async permissionSet(permission: Permission): Promise<boolean> {
    return (
      await this.apiClient.permissionOwnership.permissionSet({
        ...this.basicRequest,
        permission: permission.value,
      })
    ).unwrap();
  }

  async permissionGet(): Promise<OwnershipAndPermission> {
    const metadata = (
      await this.apiClient.document.documentMetadata(this.basicRequest)
    ).unwrap();
    if (metadata === null) {
      throw new Error('Document metadata not found');
    }

    const { owner, permission, group } = metadata;
    return {
      owner,
      permission,
      group,
    };
  }
}
