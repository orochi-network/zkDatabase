import { ZKDATABAES_USER_SYSTEM } from '../../common/const';
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

  public async createGroup(
    groupName: string,
    description?: string,
    createBy?: string
  ) {
    return this.insertOne({
      groupName,
      description: description || `Group ${groupName}`,
      createBy: '' || ZKDATABAES_USER_SYSTEM,
    });
  }
}

export default ModelGroup;
