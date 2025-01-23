/* eslint-disable import/no-cycle */
import { GROUP_DEFAULT_ADMIN } from '@common';
import {
  ModelGroup,
  ModelMetadataCollection,
  ModelMetadataDocument,
  ModelUser,
  ModelUserGroup,
} from '@model';
import {
  ETransactionStatus,
  ETransactionType,
  TDatabaseParamCreate,
  TDatabaseParamIsOwner,
  TDatabaseParamListDetail,
  TMetadataDatabaseDetail,
  TPaginationReturn,
} from '@zkdb/common';
import {
  ModelDatabase,
  ModelMetadataDatabase,
  ModelSequencer,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { Group } from './group';
import { Transaction } from './transaction';

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
          createdAt: new Date(),
          updatedAt: new Date(),
          deployStatus: ETransactionStatus.Unknown,
        },
        { session }
      );
      if (metadataDatabase) {
        // Create default group
        await Group.create(
          {
            databaseName,
            createdBy: databaseOwner,
            groupName: GROUP_DEFAULT_ADMIN,
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
            groupName: GROUP_DEFAULT_ADMIN,
          },
          session
        );

        // Enqueue transaction
        // NOTE: need to put this at last because it commit the session
        // If we put it to before another we query that have session, it will not work, since
        await Transaction.enqueue(
          databaseName,
          databaseOwner,
          ETransactionType.Deploy,
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

  public static async ownershipCheck(
    databaseName: string,
    actor: string,
    session?: ClientSession
  ) {
    if (
      !(await Database.isOwner({ databaseName, databaseOwner: actor }, session))
    ) {
      throw Error('Only database owner can roll up the transaction');
    }
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
}
