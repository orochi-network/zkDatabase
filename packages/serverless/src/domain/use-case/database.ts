import {
  DatabaseEngine,
  DbSetting,
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
    const databasesInfo = await DatabaseEngine.getInstance()
      .client.db()
      .admin()
      .listDatabases();

    const databaseInfoMap: { [name: string]: { sizeOnDisk: number } } = {};

    databasesInfo.databases.forEach((dbInfo) => {
      databaseInfoMap[dbInfo.name] = { sizeOnDisk: dbInfo.sizeOnDisk || 0 };
    });

    const settings = await ModelDbSetting.getInstance().findSettingsByFields(
      filter,
      {
        skip: pagination?.offset,
        limit: pagination?.limit,
      }
    );

    const collectionsCache: { [databaseName: string]: string[] } = {};

    const databases: (Database | null)[] = await Promise.all(
      settings.map(async (setting: DbSetting) => {
        try {
          const { databaseName, merkleHeight } = setting;

          const dbInfo = databaseInfoMap[databaseName];
          const databaseSize = dbInfo ? dbInfo.sizeOnDisk : null;

          let collections = collectionsCache[databaseName];
          if (!collections) {
            collections =
              await ModelDatabase.getInstance(databaseName).listCollections();
            collectionsCache[databaseName] = collections;
          }

          return {
            databaseName,
            merkleHeight,
            databaseSize,
            collections,
          } as Database;
        } catch (error) {
          logger.error(
            `Error processing database ${setting.databaseName}:`,
            error
          );
          return null;
        }
      })
    );

    const validDatabases = databases.filter(
      (db): db is Database => db !== null
    );

    console.log('validDatabases', validDatabases)
    return validDatabases;
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
