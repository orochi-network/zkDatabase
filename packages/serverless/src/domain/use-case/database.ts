import {
  DatabaseEngine,
  DbSetting,
  ModelDatabase,
  ModelDbSetting,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Fill } from '@orochi-network/queue';
import {
  ModelDocumentMetadata,
  ModelGroup,
  ModelCollectionMetadata,
  ModelUserGroup,
} from '@model';
import { Database, Pagination } from '../types';
import { isUserExist } from './user';
import { FilterCriteria } from '../utils';
import { readCollectionInfo } from './collection';

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
  const dbEngine = DatabaseEngine.getInstance();
  const databasesInfo = await dbEngine.client.db().admin().listDatabases();

  if (!databasesInfo?.databases?.length) {
    return [];
  }

  const databaseInfoMap: Record<string, { sizeOnDisk: number }> =
    databasesInfo.databases.reduce<Record<string, { sizeOnDisk: number }>>(
      (acc, dbInfo) => ({
        ...acc,
        [dbInfo.name]: { sizeOnDisk: dbInfo.sizeOnDisk || 0 },
      }),
      {}
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

  const databases: Database[] = (
    await Fill(
      settings.map((setting: DbSetting) => async () => {
        const { databaseName, merkleHeight, databaseOwner } = setting;
        const dbInfo = databaseInfoMap[databaseName];
        const databaseSize = dbInfo ? dbInfo.sizeOnDisk : null;

        const collectionNames =
          collectionsCache[databaseName] ||
          (collectionsCache[databaseName] =
            await ModelDatabase.getInstance(databaseName).listCollections());

        const promises = collectionNames.map(
          (collectionName) => async () =>
            readCollectionInfo(databaseName, collectionName)
        );

        const collections = (await Fill(promises)).map(({ result }) => result);

        return {
          databaseName,
          databaseOwner,
          merkleHeight,
          databaseSize,
          collections,
        } as Database;
      })
    )
  ).map(({ result }) => result);

  return databases.filter(Boolean);
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
