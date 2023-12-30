import { ZKDATABASE_GROUP_COLLECTION } from './abstract/database-engine';
import ModelCollection from './collection';
import { ModelGeneral } from './general';

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
        groupName: 'system',
        description: 'System group',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        groupName: 'admin',
        description: 'Admin group',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        groupName: 'user',
        description: 'User group',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        groupName: 'nobody',
        description: 'Nobody group',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  }
}

export default ModelGroup;
