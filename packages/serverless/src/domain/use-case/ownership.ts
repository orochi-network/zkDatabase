import { ClientSession } from 'mongodb';
import ModelUser from '../../model/global/user.js';
import { isGroupExist } from './group.js';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';
import { EOwnershipType } from '@zkdb/common';
import ModelMetadataDocument from '../../model/database/metadata-document.js';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';

export async function changeDocumentOwnership(
  databaseName: string,
  collectionName: string,
  docId: string,
  actor: string,
  group: EOwnershipType,
  newOwner: string,
  session?: ClientSession
) {
  if (
    !(await hasDocumentPermission(
      databaseName,
      collectionName,
      actor,
      docId,
      'system',
      session
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'system' permission for the specified document.`
    );
  }

  const modelMetadata = new ModelMetadataDocument(databaseName);

  if (group === EOwnershipType.User) {
    const modelUser = new ModelUser();

    if (
      !(await modelUser.isUserExist({
        userName: newOwner,
      }))
    ) {
      throw Error(`Cannot change ownership, user ${newOwner} does not exist`);
    }

    await modelMetadata.updateOne(
      {
        collection: collectionName,
        docId,
      },
      {
        $set: { owner: newOwner },
      },
      { session }
    );
  } else {
    if (!isGroupExist(databaseName, newOwner, session)) {
      throw Error(`Cannot change ownership, group ${newOwner} does not exist`);
    }
    await modelMetadata.updateOne(
      {
        collection: collectionName,
        docId,
      },
      {
        $set: { group: newOwner },
      },
      { session }
    );
  }
}

export async function changeCollectionOwnership(
  databaseName: string,
  collectionName: string,
  actor: string,
  group: EOwnershipType,
  newOwner: string,
  session?: ClientSession
) {
  if (
    !(await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'system',
      session
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'system' permission for collection '${collectionName}'.`
    );
  }

  const modelMetadata = ModelMetadataCollection.getInstance(databaseName);

  if (group === EOwnershipType.User) {
    const modelUser = new ModelUser();

    if (
      !(await modelUser.isUserExist({
        userName: newOwner,
      }))
    ) {
      throw Error(`Cannot change ownership, user ${newOwner} does not exist`);
    }

    await modelMetadata.updateOne(
      {
        collection: collectionName,
      },
      {
        $set: { owner: newOwner },
      },
      { session }
    );
  } else {
    if (!isGroupExist(databaseName, newOwner, session)) {
      throw Error(`Cannot change ownership, group ${newOwner} does not exist`);
    }
    await modelMetadata.updateOne(
      {
        collection: collectionName,
      },
      {
        $set: { group: newOwner },
      },
      { session }
    );
  }
}
