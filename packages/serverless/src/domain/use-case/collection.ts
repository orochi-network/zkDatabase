import { ModelDatabase } from '@zkdb/storage';
import { DocumentSchema } from '../types/schema';
import { Permissions } from '../types/permission';
import logger from '../../helper/logger';
import { createCollectionMetadata } from './collection-metadata';
import { createGroup } from './group';

// eslint-disable-next-line import/prefer-default-export
export async function createCollection(
  databaseName: string,
  collectionName: string,
  owner: string,
  group: string,
  schema: DocumentSchema,
  permissions: Permissions,
  groupDescription?: string
): Promise<boolean> {
  const modelDatabase = ModelDatabase.getInstance(databaseName);

  try {
    await modelDatabase.createCollection(collectionName);

    const isGroupCreated = await createGroup(databaseName, owner, group, groupDescription);

    if (!isGroupCreated) {
      throw Error('Failed to create a group')
    }

    await createCollectionMetadata(
      databaseName,
      collectionName,
      schema,
      permissions,
      owner,
      group
    );

    return true;
  } catch (error) {
    await modelDatabase.dropCollection(collectionName);
    logger.error(error);
    return false;
  }
}
