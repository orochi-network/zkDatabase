import {
  ETransactionStatus,
  ETransactionType,
  TDatabaseParamCreate,
  TDatabaseParamDeploy,
  TDatabaseParamIsOwner,
  TDatabaseParamListDetail,
  TDatabaseParamTransferOwner,
  TMetadataDatabaseDetail,
  TPaginationReturn,
} from '@zkdb/common';
import {
  ModelDatabase,
  ModelMetadataDatabase,
  ModelSequencer,
  ModelTransaction,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { DEFAULT_GROUP_ADMIN } from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';
import logger from '../../helper/logger.js';
import ModelGroup from '../../model/database/group.js';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { Group } from './group.js';
import Transaction from './transaction.js';

export class Database {
  public static async create(
    paramCreate: TDatabaseParamCreate,
    session: ClientSession
  ) {
    const { databaseName, databaseOwner, merkleHeight } = paramCreate;
    // Find user
    const user = await new ModelUser().findOne(
      { userName: databaseOwner },
      { session }
    );
    // Ensure databaseOwner existed
    if (user) {
      const imMetadataDatabase = new ModelMetadataDatabase();

      // Case database already exist
      if (await imMetadataDatabase.findOne({ databaseName }, { session })) {
        // Ensure database existing
        throw new Error(`Database name ${databaseName} already taken`);
      }
      // Initialize index
      await ModelMetadataDocument.init(databaseName, session);
      await ModelMetadataCollection.init(databaseName, session);
      await ModelGroup.init(databaseName, session);
      await ModelUserGroup.init(databaseName, session);
      await ModelSequencer.init(databaseName, session);

      const metadataDatabase = await imMetadataDatabase.insertOne(
        {
          databaseName,
          merkleHeight,
          databaseOwner,
          appPublicKey: '',
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
          deployStatus: ETransactionStatus.Unsigned,
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
    paramIsOwner: TDatabaseParamIsOwner,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, databaseOwner } = paramIsOwner;

    const database = await ModelMetadataDatabase.getInstance().findOne(
      { databaseName },
      {
        session,
      }
    );

    if (database) {
      return database.databaseOwner === databaseOwner;
    }

    throw Error('Setting has not been found');
  }

  public static async listDetail(
    paramListDetail: TDatabaseParamListDetail
  ): Promise<TPaginationReturn<TMetadataDatabaseDetail[]>> {
    const { filter, pagination } = paramListDetail;
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
    // Convert database from Mongo to a Map to perform merge 2 object by databaseName
    // Perform O(2n) instead of O(n^2)
    // Map<databaseName, sizeOfDisk>
    const databaseMap = new Map<string, number | undefined>(
      databases.map(({ name, sizeOnDisk }) => [name, sizeOnDisk])
    );
    // Get database metadata
    const imMetadataDatabase = new ModelMetadataDatabase();

    const listMetadataDatabase = await imMetadataDatabase.list(filter, {
      skip: pagination?.offset,
      limit: pagination?.limit,
    });

    return {
      data: listMetadataDatabase.map((metadata) => ({
        ...metadata,
        sizeOnDisk: databaseMap.get(metadata.databaseName),
      })),
      total: await imMetadataDatabase.count(filter),
      offset: pagination?.offset || 0,
    };
  }

  public static async transferOwnership(
    paramTransferOwner: TDatabaseParamTransferOwner
  ): Promise<boolean> {
    const { databaseName, databaseOwner, newOwner } = paramTransferOwner;
    const { collection } = new ModelMetadataDatabase();
    if (await Database.isOwner({ databaseName, databaseOwner })) {
      const result = await collection.findOneAndUpdate(
        { databaseName, databaseOwner },
        {
          $set: { databaseOwner: newOwner },
        }
      );

      return result != null;
    }

    return false;
  }

  public static async deploy(
    paramDeploy: TDatabaseParamDeploy,
    session: ClientSession
  ) {
    try {
      const { databaseName, appPublicKey } = paramDeploy;
      // Add appPublicKey for database that deployed
      await ModelMetadataDatabase.getInstance().updateOne(
        { databaseName },
        {
          appPublicKey,
        },
        { session }
      );
      // Remove data from deploy transaction
      await ModelTransaction.getInstance().deleteOne(
        { databaseName, transactionType: ETransactionType.Deploy },
        { session }
      );

      return true;
    } catch (error) {
      logger.debug(`Cannot deploy database ${error}`);
      return false;
    }
  }
}
