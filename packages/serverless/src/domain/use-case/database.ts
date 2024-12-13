import { Fill } from '@orochi-network/queue';
import {
  ETransactionStatus,
  ETransactionType,
  TDatabaseDetail,
  TMetadataDatabase,
  TPagination,
  TPaginationReturn,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { DB, ModelMetadataDatabase, ModelTransaction } from '@zkdb/storage';
import { getCurrentTime } from 'helper/common.js';
import { ClientSession } from 'mongodb';
import { DEFAULT_GROUP_ADMIN } from '../../common/const.js';
import ModelGroup from '../../model/database/group.js';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { FilterCriteria } from '../utils/document.js';
import { listCollection } from './collection.js';
import { addUsersToGroup, createGroup } from './group.js';
import Transaction from './transaction.js';
import { isUserExist } from './user.js';

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  actor: string,
  session?: ClientSession
) {
  const user = await new ModelUser().findOne({ userName: actor }, { session });
  const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();

  if (user) {
    // Case database already exist
    if (await modelDatabaseMetadata.getDatabase(databaseName, { session })) {
      // Ensure database existing
      throw new Error(`Database name ${databaseName} already taken`);
    }
    await ModelMetadataDocument.init(databaseName);
    await ModelMetadataCollection.init(databaseName);
    await ModelGroup.init(databaseName);
    await ModelUserGroup.init(databaseName);

    const dbSetting = await modelDatabaseMetadata.createMetadataDatabase(
      {
        databaseName,
        merkleHeight,
        databaseOwner: actor,
        appPublicKey: '',
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      { session }
    );
    if (dbSetting) {
      // enqueue transaction
      await Transaction.enqueue(
        databaseName,
        actor,
        ETransactionType.Deploy,
        session
      );

      // Create default group
      await createGroup(
        databaseName,
        actor,
        DEFAULT_GROUP_ADMIN,
        'Default group for owner',
        session
      );

      await addUsersToGroup(
        databaseName,
        actor,
        DEFAULT_GROUP_ADMIN,
        [actor],
        session
      );
      return true;
    }
    return false;
  }
  throw Error(`User ${actor} has not been found`);
}

export async function updateDeployedDatabase(
  databaseName: string,
  appPublicKey: string
) {
  try {
    // Add appPublicKey for database that deployed
    await ModelMetadataDatabase.getInstance().updateDatabase(databaseName, {
      appPublicKey,
    });
    // Remove data from deploy transaction
    await ModelTransaction.getInstance().remove(
      databaseName,
      ETransactionType.Deploy
    );
    return true;
  } catch (err) {
    throw new Error(`Cannot update deployed database ${err}`);
  }
}

export async function getListDatabaseDetail(
  actor: string,
  filter: FilterCriteria,
  pagination?: TPagination
): Promise<TPaginationReturn<TDatabaseDetail[]>> {
  const databasesInfo = await DATABASE_ENGINE.serverless.client
    .db()
    .admin()
    .listDatabases();

  if (!databasesInfo?.databases?.length) {
    return {
      data: [],
      total: 0,
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

  const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();
  const modelTx = ModelTransaction.getInstance();

  const databaseList = await modelDatabaseMetadata.getListDatabase(filter, {
    skip: pagination?.offset,
    limit: pagination?.limit,
  });

  if (!databaseList?.length) {
    // When user don't have any DB
    return {
      data: [],
      total: 0,
      offset: pagination?.offset ?? 0,
    };
  }

  const databases: TDatabaseDetail[] = (
    await Fill(
      databaseList.map((setting: TMetadataDatabase) => async () => {
        const { databaseName, merkleHeight, databaseOwner, appPublicKey } =
          setting;
        const dbInfo = databaseInfoMap[databaseName];
        const databaseSize = dbInfo ? dbInfo.sizeOnDisk : null;

        const collection = await listCollection(databaseName, actor);

        const latestTransaction = await Transaction.latest(
          databaseName,
          ETransactionType.Deploy
        );

        let deployStatus = latestTransaction?.status ?? null;

        if (
          latestTransaction &&
          deployStatus === ETransactionStatus.Confirming
        ) {
          if (latestTransaction.txHash) {
            const zkAppTransaction =
              await MinaNetwork.getInstance().getZkAppTransactionByTxHash(
                latestTransaction.txHash
              );

            if (zkAppTransaction?.txStatus === 'failed') {
              deployStatus = ETransactionStatus.Failed;
              await modelTx.updateById(latestTransaction._id, {
                status: deployStatus,
                error: zkAppTransaction.failures.join(' '),
              });
            } else if (zkAppTransaction?.txStatus === 'applied') {
              deployStatus = ETransactionStatus.Confirmed;
              await modelTx.updateById(latestTransaction._id, {
                status: deployStatus,
              });
            }
          } else {
            deployStatus = ETransactionStatus.Failed;
            await modelTx.updateById(latestTransaction._id, {
              status: deployStatus,
              error: 'Transaction hash is missed',
            });
          }
        }

        return {
          databaseName,
          databaseOwner,
          merkleHeight,
          databaseSize,
          collection,
          appPublicKey,
          deployStatus,
        };
      })
    )
  )
    .map(({ result }) => result)
    .filter(Boolean);

  return {
    data: databases.filter(Boolean),
    offset: pagination?.offset ?? 0,
    total: await modelDatabaseMetadata.count(filter),
  };
}

export async function getDatabase(
  databaseName: string,
  session?: ClientSession
): Promise<TMetadataDatabase> {
  const setting = await ModelMetadataDatabase.getInstance().getDatabase(
    databaseName,
    {
      session,
    }
  );

  if (setting) {
    return setting;
  }

  throw Error('Database has not been found');
}

export async function isDatabaseOwner(
  databaseName: string,
  actor: string,
  session?: ClientSession
): Promise<boolean> {
  const setting = await ModelMetadataDatabase.getInstance().getDatabase(
    databaseName,
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
  newOwner: string
): Promise<boolean> {
  const database = await getDatabase(databaseName);
  const dbOwner = database.databaseOwner;

  if (actor === dbOwner) {
    if (await isUserExist(newOwner)) {
      const result = await ModelMetadataDatabase.getInstance().updateDatabase(
        databaseName,
        { databaseOwner: newOwner }
      );
      return result.acknowledged;
    }

    throw Error(`User ${newOwner} does not exist`);
  }

  throw Error('You do not have permission to change the db owner');
}
