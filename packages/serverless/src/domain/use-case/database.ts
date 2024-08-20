import {
  DatabaseEngine,
  DbSetting,
  ModelDatabase,
  ModelDbSetting,
} from '@zkdb/storage';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelGroup from '../../model/database/group.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { Database } from '../types/database.js';
import { Pagination } from '../types/pagination.js';
import { QueryOptions } from '../types/search.js';
import filterItems from '../query/array-filter.js';
import { isUserExist } from './user.js';

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
  await ModelDbSetting.getInstance(databaseName).updateSetting({
    merkleHeight,
    appPublicKey,
    databaseOwner: actor,
  });
  return true;
}

export async function getDatabases(
  query?: QueryOptions<Database>,
  pagination?: Pagination
): Promise<Database[]> {
  const databasesInfo = await DatabaseEngine.getInstance()
    .client.db()
    .admin()
    .listDatabases();

  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? databasesInfo.databases.length;

  const databases: Database[] = await Promise.all(
    databasesInfo.databases
      .filter(
        (db) => !['admin', 'local', '_zkdatabase_metadata'].includes(db.name)
      )
      .slice(offset, offset + limit)
      .map(async (database) => {
        const collections = await ModelDatabase.getInstance(
          database.name
        ).listCollections();
        const settings = await ModelDbSetting.getInstance(
          database.name
        ).getSetting();
        return {
          databaseName: database.name,
          merkleHeight: settings!.merkleHeight,
          databaseSize: database.sizeOnDisk,
          collections,
        } as Database;
      })
  );

  return filterItems<Database>(databases, query, 10);
}

export async function getDatabaseSetting(
  databaseName: string
): Promise<DbSetting> {
  const setting = await ModelDbSetting.getInstance(databaseName).getSetting();

  if (setting) {
    return setting;
  }

  throw Error('Setting has not been found');
}

export async function isDatabaseOwner(
  databaseName: string,
  actor: string
): Promise<boolean> {
  const setting = await ModelDbSetting.getInstance(databaseName).getSetting();

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
      const result = await ModelDbSetting.getInstance(databaseName).updateSetting({
        databaseOwner: newOwner,
      });

      return result.acknowledged
    }

    throw Error(`User ${newOwner} does not exist`);
  }

  throw Error('You do not have permission to change the db owner');
}
