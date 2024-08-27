import { ClientSession, ObjectId } from 'mongodb';
import { OwnershipGroup } from '../types/ownership.js';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelUser from '../../model/global/user.js';
import { isGroupExist } from './group.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';

export async function changeDocumentOwnership(
  databaseName: string,
  collectionName: string,
  docId: string,
  actor: string,
  group: OwnershipGroup,
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

  const modelMetadata = new ModelDocumentMetadata(databaseName);

  if (group === 'User') {
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
        owner: newOwner,
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
        group: newOwner,
      },
      { session }
    );
  }
}

export async function changeCollectionOwnership(
  databaseName: string,
  collectionName: string,
  actor: string,
  group: OwnershipGroup,
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

  const modelMetadata = ModelCollectionMetadata.getInstance(databaseName);

  if (group === 'User') {
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
        owner: newOwner,
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
        group: newOwner,
      },
      { session }
    );
  }
}
