import { ObjectId } from 'mongodb';
import { OwnershipGroup } from '../types/ownership';
import { checkCollectionPermission, checkDocumentPermission } from './permission';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import ModelUser from '../../model/global/user';
import { isGroupExist } from './group';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';

export async function changeDocumentOwnership(
  databaseName: string,
  collectionName: string,
  docId: ObjectId,
  actor: string,
  group: OwnershipGroup,
  newOwner: string
) {
  if (
    !(await checkDocumentPermission(
      databaseName,
      collectionName,
      actor,
      docId,
      'system'
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
      }
    );
  } else {
    if (!isGroupExist(databaseName, newOwner)) {
      throw Error(`Cannot change ownership, group ${newOwner} does not exist`);
    }
    await modelMetadata.updateOne(
      {
        collection: collectionName,
        docId,
      },
      {
        group: newOwner,
      }
    );
  }
}

export async function changeCollectionOwnership(
  databaseName: string,
  collectionName: string,
  actor: string,
  group: OwnershipGroup,
  newOwner: string
) {
  if (
    !(await checkCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'system'
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
        collection: collectionName
      },
      {
        owner: newOwner,
      }
    );
  } else {
    if (!isGroupExist(databaseName, newOwner)) {
      throw Error(`Cannot change ownership, group ${newOwner} does not exist`);
    }
    await modelMetadata.updateOne(
      {
        collection: collectionName
      },
      {
        group: newOwner,
      }
    );
  }
}
