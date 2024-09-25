import {
  DatabaseEngine,
  DbSetting,
  ModelCollection,
  ModelDatabase,
  ModelDbSetting,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelGroup from '../../model/database/group.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { Database } from '../types/database.js';
import { Pagination } from '../types/pagination.js';
import { isUserExist } from './user.js';
import logger from '../../helper/logger.js';
import { FilterCriteria } from '../utils/document.js';
import { Collection } from '../types/collection.js';

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  actor: string,
  appPublicKey: string
) {
  if (await DatabaseEngine.getInstance().isDatabase(databaseName)) {
    // Ensure database existing
    return true;
  }
  await ModelDocumentMetadata.init(databaseName);
  await ModelCollectionMetadata.init(databaseName);
  await ModelGroup.init(databaseName);
  await ModelUserGroup.init(databaseName);
  await ModelDbSetting.getInstance().createSetting({
    databaseName,
    merkleHeight,
    appPublicKey,
    databaseOwner: actor,
  });
  return true;
}

export async function getDatabases(
  filter: FilterCriteria,
  pagination?: Pagination
): Promise<Database[]> {
  try {
    const dbEngine = DatabaseEngine.getInstance();
    const databasesInfo = await dbEngine.client.db().admin().listDatabases();

    if (!databasesInfo?.databases?.length) {
      return [];
    }

    const databaseInfoMap: Record<string, { sizeOnDisk: number }> =
      databasesInfo.databases.reduce(
        (acc, dbInfo) => {
          acc[dbInfo.name] = { sizeOnDisk: dbInfo.sizeOnDisk || 0 };
          return acc;
        },
        {} as Record<string, { sizeOnDisk: number }>
      );

    const settings = await ModelDbSetting.getInstance().findSettingsByFields(
      filter,
      {
        skip: pagination?.offset,
        limit: pagination?.limit,
      }
    );

    if (!settings?.length) {
      return [];
    }

    const collectionsCache: Record<string, string[]> = {};

    const databases: Database[] = await Promise.all(
      settings.map(async (setting: DbSetting) => {
        const { databaseName, merkleHeight } = setting;
        const dbInfo = databaseInfoMap[databaseName];
        const databaseSize = dbInfo ? dbInfo.sizeOnDisk : null;

        const collectionNames =
          collectionsCache[databaseName] ||
          (collectionsCache[databaseName] =
            await ModelDatabase.getInstance(databaseName).listCollections());

        const collections: Collection[] = await Promise.all(
          collectionNames.map(async (collectionName) => {
            const indexes = await ModelCollection.getInstance(
              databaseName,
              collectionName
            ).listIndexes();
            return { name: collectionName, indexes };
          })
        );

        return {
          databaseName,
          merkleHeight,
          databaseSize,
          collections,
        } as Database;
      })
    ).catch((error) => {
      logger.error(`Error processing databases:`, error);
      throw error;
    });

    return databases.filter(Boolean); // Filter out any `null` results
  } catch (error) {
    logger.error('An error occurred in getDatabases:', error);
    throw error;
  }
}

export async function getDatabaseSetting(
  databaseName: string
): Promise<DbSetting> {
  const setting = await ModelDbSetting.getInstance().getSetting(databaseName);

  if (setting) {
    return setting;
  }

  throw Error('Setting has not been found');
}

export async function isDatabaseOwner(
  databaseName: string,
  actor: string,
  session?: ClientSession
): Promise<boolean> {
  const setting = await ModelDbSetting.getInstance().getSetting(databaseName, {
    session,
  });

  if (setting) {
    return setting.databaseOwner === actor;
  }

  throw Error('Setting has not been found');
}

export async function changeDatabaseOwner(
  databaseName: string,
  actor: string,
  newOwner: string
): Promise<boolean> {
  const dbSetting = await getDatabaseSetting(databaseName);
  const dbOwner = dbSetting.databaseOwner;

  if (actor === dbOwner) {
    if (await isUserExist(newOwner)) {
      const result = await ModelDbSetting.getInstance().changeDatabaseOwner(
        databaseName,
        newOwner
      );

      return result.acknowledged;
    }

    throw Error(`User ${newOwner} does not exist`);
  }

  throw Error('You do not have permission to change the db owner');
}
