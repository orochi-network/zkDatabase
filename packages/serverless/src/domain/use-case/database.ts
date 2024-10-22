import {
  DatabaseEngine,
  DbSetting,
  ModelDatabase,
  ModelDbSetting,
  ModelNetwork,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Fill } from '@orochi-network/queue';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelGroup from '../../model/database/group.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { Database } from '../types/database.js';
import { Pagination, PaginationReturn } from '../types/pagination.js';
import { isUserExist } from './user.js';
import { FilterCriteria } from '../utils/document.js';
import { readCollectionInfo } from './collection.js';
import { NetworkId } from '../types/network.js';

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  actor: string,
  appPublicKey: string,
  networkId: NetworkId
) {
  // Case database already exist
  if (await DatabaseEngine.getInstance().isDatabase(databaseName, networkId)) {
    // Ensure database existing
    throw new Error(`Database name ${databaseName} already taken`);
  }
  await ModelDocumentMetadata.init(databaseName, networkId);
  await ModelCollectionMetadata.init(databaseName, networkId);
  await ModelGroup.init(databaseName, networkId);
  await ModelUserGroup.init(databaseName, networkId);

  const modelNetwork = ModelNetwork.getInstance();

  const networks = await (
    await modelNetwork.find({ networkId: networkId, active: true })
  ).toArray();

  if (networks.length > 0) {
    await ModelDbSetting.getInstance().createSetting({
      databaseName,
      merkleHeight,
      appPublicKey,
      databaseOwner: actor,
      networkId,
    });
  } else {
    throw Error('Wrong Network Type');
  }
  return true;
}

export async function getDatabases(
  networkId: NetworkId,
  actor: string,
  filter: FilterCriteria,
  pagination?: Pagination
): Promise<PaginationReturn<Database[]>> {
  const dbEngine = DatabaseEngine.getInstance();
  const databasesInfo = await dbEngine.client.db().admin().listDatabases();

  if (!databasesInfo?.databases?.length) {
    return {
      data: [],
      totalSize: 0,
      offset: pagination?.offset ?? 0,
    };
  }

  const databaseInfoMap: Record<string, { sizeOnDisk: number }> =
    databasesInfo.databases.reduce<Record<string, { sizeOnDisk: number }>>(
      (acc, dbInfo) => ({
        ...acc,
        [dbInfo.name]: { sizeOnDisk: dbInfo.sizeOnDisk || 0 },
      }),
      {}
    );

  const modelSetting = ModelDbSetting.getInstance();

  const settings = await modelSetting.findSettingsByFields(filter, {
    skip: pagination?.offset,
    limit: pagination?.limit,
  });

  if (!settings?.length) {
    // When user don't have any DB
    return {
      data: [],
      totalSize: 0,
      offset: pagination?.offset ?? 0,
    };
  }

  const collectionsCache: Record<string, string[]> = {};

  const databases: Database[] = (
    await Fill(
      settings
        .filter((settings) => settings.networkId === networkId)
        .map((setting: DbSetting) => async () => {
          const { databaseName, merkleHeight, databaseOwner, networkId } =
            setting;
          const dbInfo =
            databaseInfoMap[
              DatabaseEngine.getValidName(databaseName, networkId)
            ];
          const databaseSize = dbInfo ? dbInfo.sizeOnDisk : null;

          const collectionNames =
            collectionsCache[databaseName] ||
            (collectionsCache[databaseName] = await ModelDatabase.getInstance(
              databaseName,
              networkId
            ).listCollections());

          const promises = collectionNames.map(
            (collectionName) => async () =>
              readCollectionInfo(databaseName, collectionName, actor, networkId)
          );

          const collections = (await Fill(promises))
            .map(({ result }) => result)
            .filter(Boolean);

          return {
            databaseName,
            databaseOwner,
            merkleHeight,
            databaseSize,
            collections,
          } as Database;
        })
    )
  )
    .map(({ result }) => result)
    .filter(Boolean);

  return {
    data: databases.filter(Boolean),
    offset: pagination?.offset ?? 0,
    totalSize: await modelSetting.count(filter),
  };
}

export async function getDatabaseSetting(
  databaseName: string,
  networkId: NetworkId
): Promise<DbSetting> {
  const setting = await ModelDbSetting.getInstance().getSetting(
    databaseName,
    networkId
  );

  if (setting) {
    return setting;
  }

  throw Error('Setting has not been found');
}

export async function isDatabaseOwner(
  databaseName: string,
  actor: string,
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  const setting = await ModelDbSetting.getInstance().getSetting(
    databaseName,
    networkId,
    {
      session,
    }
  );
  if (setting) {
    return setting.databaseOwner === actor;
  }

  throw Error('Setting has not been found');
}

export async function changeDatabaseOwner(
  databaseName: string,
  actor: string,
  newOwner: string,
  networkId: NetworkId
): Promise<boolean> {
  const dbSetting = await getDatabaseSetting(databaseName, networkId);
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
