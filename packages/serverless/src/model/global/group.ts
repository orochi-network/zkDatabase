import {
  ZKDATABAES_GROUP_NOBODY,
  ZKDATABAES_GROUP_SYSTEM,
  ZKDATABAES_USER_SYSTEM,
  ZKDATABASE_GROUP_COLLECTION,
} from '../../common/const';
import ModelCollection from '../abstract/collection';
import { ModelGeneral } from '../abstract/general';

export type GroupSchema = {
  groupName: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ModelGroup extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_GROUP_COLLECTION);
  }

  public static async init(databaseName: string) {
    // Index for group name
    await new ModelCollection(databaseName, ZKDATABASE_GROUP_COLLECTION).create(
      { groupName: 1 },
      { unique: true }
    );

    // Create default group
    await new ModelGroup(databaseName).insertMany([
      {
        groupName: ZKDATABAES_GROUP_SYSTEM,
        description: 'System group',
        createdBy: ZKDATABAES_USER_SYSTEM,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        groupName: 'admin',
        description: 'Admin group',
        createdBy: ZKDATABAES_USER_SYSTEM,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        groupName: 'user',
        description: 'User group',
        createdBy: ZKDATABAES_USER_SYSTEM,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        groupName: ZKDATABAES_GROUP_NOBODY,
        description: 'Nobody group',
        createdBy: ZKDATABAES_USER_SYSTEM,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }
}

export default ModelGroup;
