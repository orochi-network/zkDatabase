import { IApiClient } from '@zkdb/api';
import { EOwnershipType, TCollectionMetadata } from '@zkdb/common';
import { OwnershipAndPermission, Permission } from '@zkdb/permission';
import { IMetadata } from '../interfaces';

export class CollectionMetadata implements IMetadata<TCollectionMetadata> {
  private databaseName: string;

  private collectionName: string;

  private apiClient: IApiClient;

  private get basicRequest() {
    return {
      databaseName: this.databaseName,
      collectionName: this.collectionName,
    };
  }

  constructor(
    apiClient: IApiClient,
    databaseName: string,
    collectionName: string
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.apiClient = apiClient;
  }

  async info(): Promise<TCollectionMetadata | null> {
    return (
      await this.apiClient.collection.collectionMetadata(this.basicRequest)
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
    const { owner, permission, group } = (
      await this.apiClient.collection.collectionMetadata(this.basicRequest)
    ).unwrap();
    return {
      owner,
      permission,
      group,
    };
  }
}
