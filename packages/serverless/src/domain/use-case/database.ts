import { Fill } from '@orochi-network/queue';
import { ZKDatabaseSmartContractWrapper } from '@zkdb/smart-contract';
import {
  DatabaseEngine,
  DbSetting,
  ModelDatabase,
  ModelDbSetting,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Mina, PrivateKey, PublicKey } from 'o1js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { Database } from '../types/database.js';
import { Pagination, PaginationReturn } from '../types/pagination.js';
import { FilterCriteria } from '../utils/document.js';
import { readCollectionInfo } from './collection.js';
import { isUserExist } from './user.js';

type DbDeployRequest = {
  databaseName: string;
  merkleHeight: number;
  userPublicKey: string;
  databaseOwner: string;
};

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  actor: string
) {
  // Case database already exist
  if (await DatabaseEngine.getInstance().isDatabase(databaseName)) {
    // Ensure database existing
    throw new Error(`Database name ${databaseName} already taken`);
  }
  await ModelDocumentMetadata.init(databaseName);
  await ModelCollectionMetadata.init(databaseName);
  await ModelGroup.init(databaseName);
  await ModelUserGroup.init(databaseName);
  await ModelDbSetting.getInstance().createSetting({
    databaseName,
    merkleHeight,
    databaseOwner: actor,
    deployStatus: 'ready',
  });

  return true;
}

export async function deployDatabase(args: DbDeployRequest) {
  const { merkleHeight, databaseName, databaseOwner, userPublicKey } = args;
  // Check db status first and these field a match
  const [db, ..._] = await ModelDbSetting.getInstance().findSettingsByFields({
    merkleHeight,
    databaseName,
    databaseOwner,
    deployStatus: 'ready',
  });

  const user = await new ModelUser().findOne({ publicKey: userPublicKey });

  if (!db || db.databaseOwner !== user?.userName) {
    throw new Error(`Cannot find database ${databaseName}`);
  }

  // Set active network
  const network = Mina.Network({
    networkId: 'mainnet',
    mina: 'https://api.minascan.io/node/mainnet/v1/graphql',
  });

  Mina.setActiveInstance(network);
  // Create keypair for zkApp contract

  const zkDbPrivateKey = PrivateKey.random();
  const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
  await ModelDbSetting.getInstance().updateSetting(db.databaseName, {
    appPublicKey: zkDbPublicKey.toBase58(),
  });
  // Init zk wrapper
  const zkWrapper = new ZKDatabaseSmartContractWrapper(
    merkleHeight,
    zkDbPublicKey
  );
  // Compile
  await zkWrapper.compile();
  // Create unsigned transaction
  let unsignedTx = await zkWrapper.createAndProveDeployTransaction(
    PublicKey.fromBase58(userPublicKey)
  );
  unsignedTx = unsignedTx.sign([zkDbPrivateKey]);
  return {
    tx: unsignedTx,
    zkAppAddress: zkDbPublicKey.toBase58(),
  };
}

export async function updateDatabaseDeployedStatus(
  dbName: string,
  dbOwner: string
) {
  const db = await getDatabaseSetting(dbName);
  if (db.databaseOwner !== dbOwner) {
    throw Error('You do not have permission to update the db');
  }
  await ModelDbSetting.getInstance().updateSetting(dbName, {
    deployStatus: 'deployed',
  });
  return true;
}

export async function getDatabases(
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
      settings.map((setting: DbSetting) => async () => {
        const { databaseName, merkleHeight, databaseOwner, deployStatus } =
          setting;
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
          deployStatus,
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
