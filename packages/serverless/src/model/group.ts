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
    return new ModelCollection(
      databaseName,
      ZKDATABASE_GROUP_COLLECTION
    ).create(['groupName']);
  }
}

export default ModelGroup;
