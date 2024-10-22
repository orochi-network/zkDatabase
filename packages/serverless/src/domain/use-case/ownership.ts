import { ClientSession } from 'mongodb';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelUser from '../../model/global/user.js';
import { OwnershipGroup } from '../types/ownership.js';
import { isGroupExist } from './group.js';
import {
  hasCollectionPermission,
  hasDocumentPermission,
} from './permission.js';
import { NetworkId } from '../types/network.js';

export async function changeDocumentOwnership(
  networkId: NetworkId,
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
      networkId,
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

  const modelMetadata = ModelDocumentMetadata.getInstance(
    databaseName,
    networkId
  );

  if (group === 'User') {
    const modelUser = new ModelUser();

    if (
      !(await modelUser.isUserExist(
        {
          userName: newOwner,
        },
        networkId
      ))
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
    if (!isGroupExist(databaseName, newOwner, networkId, session)) {
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
  networkId: NetworkId,
  databaseName: string,
  collectionName: string,
  actor: string,
  group: OwnershipGroup,
  newOwner: string,
  session?: ClientSession
) {
  if (
    !(await hasCollectionPermission(
      networkId,
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

  const modelMetadata = ModelCollectionMetadata.getInstance(
    databaseName,
    networkId
  );

  if (group === 'User') {
    const modelUser = new ModelUser();

    if (
      !(await modelUser.isUserExist(
        {
          userName: newOwner,
        },
        networkId
      ))
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
    if (!isGroupExist(databaseName, newOwner, networkId, session)) {
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
