import { ModelGeneral } from '../abstract/general';

export type GroupSchema = {
  groupName: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ModelGroup extends ModelGeneral {
  static collectionName: string = 'group';

  constructor(databaseName: string) {
    super(databaseName, ModelGroup.collectionName);
  }
}

export default ModelGroup;
