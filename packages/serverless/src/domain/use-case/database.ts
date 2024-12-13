import { Fill } from '@orochi-network/queue';
import {
  ETransactionStatus,
  ETransactionType,
  TDatabaseDetail,
  TMetadataDatabase,
  TMetadataDetail,
  TPagination,
  TPaginationReturn,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import {
  DATABASE_ENGINE,
  ModelDatabase,
  ModelMetadataDatabase,
  ModelSequencer,
  ModelTransaction,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { DEFAULT_GROUP_ADMIN } from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';
import ModelGroup from '../../model/database/group.js';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { FilterCriteria } from '../utils/document.js';
import { Collection, listCollection } from './collection.js';
import { Group } from './group.js';
import Transaction from './transaction.js';
import { isUserExist } from './user.js';

type TDatabaseParamCreate = Pick<
  TMetadataDatabase,
  'databaseName' | 'merkleHeight' | 'databaseOwner'
>;

type TDatabaseParamIsOwner = Pick<
  TMetadataDatabase,
  'databaseName' | 'databaseOwner'
>;

type TDatabaseParamListDetail = Pick<TMetadataDatabase, 'databaseOwner'> & {
  filter: Partial<TMetadataDatabase>;
  pagination?: TPagination;
};

class Database {
  public static async create(
    params: TDatabaseParamCreate,
    session?: ClientSession
  ) {
    const { databaseName, databaseOwner, merkleHeight } = params;
    // Find user
    const user = await new ModelUser().findOne(
      { userName: databaseOwner },
      { session }
    );
    // Ensure databaseOwner existed
    if (user) {
      const modelDatabaseMetadata = new ModelMetadataDatabase();

      // Case database already exist
      if (await modelDatabaseMetadata.getDatabase(databaseName, { session })) {
        // Ensure database existing
        throw new Error(`Database name ${databaseName} already taken`);
      }
      // Initialize index
      await ModelMetadataDocument.init(databaseName, session);
      await ModelMetadataCollection.init(databaseName, session);
      await ModelGroup.init(databaseName, session);
      await ModelUserGroup.init(databaseName, session);
      await ModelSequencer.init(databaseName, session);

      const metadataDatabase =
        await modelDatabaseMetadata.createMetadataDatabase(
          {
            databaseName,
            merkleHeight,
            databaseOwner,
            appPublicKey: '',
            createdAt: getCurrentTime(),
            updatedAt: getCurrentTime(),
          },
          { session }
        );
      if (metadataDatabase) {
        // Enqueue transaction
        await Transaction.enqueue(
          databaseName,
          databaseOwner,
          ETransactionType.Deploy,
          session
        );

        // Create default group
        await Group.create(
          {
            databaseName,
            createdBy: databaseOwner,
            groupName: DEFAULT_GROUP_ADMIN,
            groupDescription: 'Default group for owner',
          },
          session
        );
        // After created group, add owner to list participant
        await Group.addListUser(
          {
            databaseName,
            createdBy: databaseOwner,
            listUserName: [databaseOwner],
            groupName: DEFAULT_GROUP_ADMIN,
          },
          session
        );
        return true;
      }
      return false;
    }
    throw Error(`User ${databaseOwner} has not been found`);
  }

  public static async isOwner(
    params: TDatabaseParamIsOwner,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, databaseOwner } = params;

    const database = await ModelMetadataDatabase.getInstance().getDatabase(
      databaseName,
      {
        session,
      }
    );

    if (database) {
      return database.databaseOwner === databaseOwner;
    }

    throw Error('Setting has not been found');
  }

  public static async listDetail(params: TDatabaseParamListDetail) {
    const { databaseOwner, filter, pagination } = params;
    // Get db instance from ModelDatabase
    const { db } = new ModelDatabase();
    // Get system DB metadata from Mongo: name, sizeOnDisk, empty,...
    const { databases } = await db.admin().listDatabases();

    if (!databases.length) {
      // List database is empty
      return {
        data: [], // listDetailDatabase now empty
        total: 0,
        offset: pagination?.offset || 0,
      };
    }
    // Using map to assign default value sizeOnDisk to 0
    // Instead using reduce
    const listDatabase = databases.map((database) => ({
      ...database,
      sizeOnDisk: database.sizeOnDisk || 0,
    }));

    // Get database metadata
    const modelMetadataDatabase = new ModelMetadataDatabase();

    const listMetadataDatabase = await modelMetadataDatabase.getListDatabase(
      filter,
      {
        skip: pagination?.offset,
        limit: pagination?.limit,
      }
    );
    // Using Fill to perform a concurrency heavy join between mongoDB db and our metadata db
    const listDetailDatabase: TDatabaseDetail[] = (
      await Fill(
        listMetadataDatabase.map(
          (database) => async (): Promise<TDatabaseDetail> => {
            const { databaseName, merkleHeight, appPublicKey } = database;
            const collection = await listCollection(
              databaseName,
              databaseOwner
            );

            return {};
          }
        )
      )
    ).map(({ result }) => result);

    return listDetailDatabase;
  }

  public static async updateDeployedDatabase(
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
