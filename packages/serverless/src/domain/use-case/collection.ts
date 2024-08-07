import { ModelDatabase } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { DocumentSchema } from '../types/schema.js';
import { Permissions } from '../types/permission.js';
import logger from '../../helper/logger.js';
import { createCollectionMetadata } from './collection-metadata.js';
import { createGroup } from './group.js';

// eslint-disable-next-line import/prefer-default-export
export async function createCollection(
  databaseName: string,
  collectionName: string,
  owner: string,
  group: string,
  schema: DocumentSchema,
  permissions: Permissions,
  groupDescription?: string,
  session?: ClientSession
): Promise<boolean> {
  const modelDatabase = ModelDatabase.getInstance(databaseName);

  if (await modelDatabase.isCollectionExist(collectionName)) {
    throw Error(
      `Collection ${collectionName}already exist in database ${databaseName}`
    );
  }

  try {
    await modelDatabase.createCollection(collectionName);

    const isGroupCreated = await createGroup(
      databaseName,
      owner,
      group,
      groupDescription,
      session
    );

    if (!isGroupCreated) {
      throw Error('Failed to create a group');
    }

    await createCollectionMetadata(
      databaseName,
      collectionName,
      schema,
      permissions,
      owner,
      group,
      session
    );

    return true;
  } catch (error) {
    await modelDatabase.dropCollection(collectionName);
    logger.error(error);
    return false;
  }
}
