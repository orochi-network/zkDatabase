import { DatabaseEngine, ModelDatabase, ModelDbSetting } from '@zkdb/storage';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelGroup from '../../model/database/group.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { Database } from '../types/database.js';
import { Pagination } from '../types/pagination.js';
import { QueryOptions } from '../types/search.js';
import filterItems from '../query/array-filter.js';

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
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
