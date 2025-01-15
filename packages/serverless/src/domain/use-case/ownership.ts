import {
  EOwnershipType,
  TParamCollectionOwnership,
  TParamDocumentOwnership,
} from '@zkdb/common';
import { ClientSession } from 'mongodb';
import {
  ModelMetadataCollection,
  ModelMetadataDocument,
  ModelUser,
} from '@model';
import { Group } from './group';
import { PermissionSecurity } from './permission-security';

export class Ownership {
  public static async transferCollection(
    paramTransfer: TParamCollectionOwnership,
    session?: ClientSession
  ) {
    const { databaseName, collectionName, actor, groupType, newOwner } =
      paramTransfer;
    // Get actor permission
    const actorPermission = await PermissionSecurity.collection(
      { databaseName, collectionName, actor },
      session
    );
    // Checking system permission
    if (!actorPermission.system) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'system' permission for collection '${collectionName}'.`
      );
    }

    if (groupType === EOwnershipType.User) {
      const imUser = new ModelUser();
      // Ensure the target user exist
      if (
        !(await imUser.isExist({
          userName: newOwner,
        }))
      ) {
        throw Error(`Cannot change ownership, user ${newOwner} does not exist`);
      }

      const imMetadataCollection =
        ModelMetadataCollection.getInstance(databaseName);

      const result = await imMetadataCollection.updateOne(
        {
          collectionName,
        },
        {
          $set: { owner: newOwner },
        },
        { session }
      );

      return result.acknowledged;
    }

    // Case groupType is EOwnershipType.Group
    if (!Group.exist({ databaseName, groupName: newOwner }, session)) {
      throw Error(`Cannot change ownership, group ${newOwner} does not exist`);
    }

    const imMetadataCollection =
      ModelMetadataCollection.getInstance(databaseName);

    const result = await imMetadataCollection.updateOne(
      {
        collectionName,
      },
      {
        $set: { group: newOwner },
      },
      { session }
    );

    return result.acknowledged;
  }
  public static async transferDocument(
    paramTransfer: TParamDocumentOwnership,
    session?: ClientSession
  ) {
    const { databaseName, collectionName, docId, groupType, actor, newOwner } =
      paramTransfer;

    const actorPermission = await PermissionSecurity.document(
      { databaseName, collectionName, docId, actor },
      session
    );

    if (!actorPermission.system) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'system' permission for the specified document.`
      );
    }

    if (groupType === EOwnershipType.User) {
      const imUser = new ModelUser();

      if (
        !(await imUser.isExist({
          userName: newOwner,
        }))
      ) {
        throw Error(`Cannot change ownership, user ${newOwner} does not exist`);
      }

      const imMetadataDocument = new ModelMetadataDocument(databaseName);

      const result = await imMetadataDocument.updateOne(
        {
          collectionName,
          docId,
        },
        {
          $set: { owner: newOwner },
        },
        { session }
      );

      return result.acknowledged;
    }

    if (!Group.exist({ databaseName, groupName: newOwner }, session)) {
      throw Error(`Cannot change ownership, group ${newOwner} does not exist`);
    }

    const imMetadataDocument = new ModelMetadataDocument(databaseName);

    const result = await imMetadataDocument.updateOne(
      {
        collectionName,
        docId,
      },
      {
        $set: { group: newOwner },
      },
      { session }
    );
    return result.acknowledged;
  }
}
