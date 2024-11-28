import { Fill } from '@orochi-network/queue';
import { MinaNetwork } from '@zkdb/smart-contract';
import {
  DB,
  DbSetting,
  ModelDbSetting,
  ModelDbTransaction,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { Database } from '../types/database.js';
import { Pagination, PaginationReturn } from '../types/pagination.js';
import { FilterCriteria } from '../utils/document.js';
import { listCollections } from './collection.js';
import { enqueueTransaction, getLatestTransaction } from './transaction.js';
import { isUserExist } from './user.js';

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  actor: string
) {
  const user = await new ModelUser().findOne({ userName: actor });

  if (user) {
    // Case database already exist
    if (await DB.service.isDatabase(databaseName)) {
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
    });

    await enqueueTransaction(databaseName, actor, 'deploy');

    return true;
  }

  throw Error(`User ${actor} has not been found`);
}

export async function updateDeployedDatabase(
  databaseName: string,
  appPublicKey: string
) {
  try {
    // Add appPublicKey for database that deployed
    await ModelDbSetting.getInstance().updateSetting(databaseName, {
      appPublicKey,
    });
    // Remove data from deploy transaction
    await ModelDbTransaction.getInstance().remove(databaseName, 'deploy');
    return true;
  } catch (err) {
    throw new Error(`Cannot update deployed database ${err}`);
  }
}

export async function getDatabases(
  actor: string,
  filter: FilterCriteria,
  pagination?: Pagination
): Promise<PaginationReturn<Database[]>> {
  const databasesInfo = await DB.service.client.db().admin().listDatabases();

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
  const modelTx = ModelDbTransaction.getInstance();

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

  const databases: Database[] = (
    await Fill(
      settings.map((setting: DbSetting) => async () => {
        const { databaseName, merkleHeight, databaseOwner, appPublicKey } =
          setting;
        const dbInfo = databaseInfoMap[databaseName];
        const databaseSize = dbInfo ? dbInfo.sizeOnDisk : null;

        const collections = await listCollections(databaseName, actor);

        const latestTransaction = await getLatestTransaction(
          databaseName,
          'deploy'
        );

        let deployStatus = latestTransaction?.status ?? null;

        if (latestTransaction && deployStatus === 'pending') {
          if (latestTransaction.txHash) {
            const zkAppTransaction =
              await MinaNetwork.getInstance().getZkAppTransactionByTxHash(
                latestTransaction.txHash
              );

            if (zkAppTransaction?.txStatus === 'failed') {
              deployStatus = 'failed';
              await modelTx.updateById(latestTransaction._id.toString(), {
                status: 'failed',
                error: zkAppTransaction.failures.join(' '),
              });
            } else if (zkAppTransaction?.txStatus === 'applied') {
              deployStatus = 'success';
              await modelTx.updateById(latestTransaction._id.toString(), {
                status: 'success',
              });
            }
          } else {
            deployStatus = 'failed';
            await modelTx.updateById(latestTransaction._id.toString(), {
              status: 'failed',
              error: 'Transaction hash is missed',
            });
          }
        }

        return {
          databaseName,
          databaseOwner,
          merkleHeight,
          databaseSize,
          collections,
          appPublicKey,
          deployStatus,
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
