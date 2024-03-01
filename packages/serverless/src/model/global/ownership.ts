import { Document } from 'mongodb';
import { randomBytes } from 'crypto';
import * as jose from 'jose';
import { ZKDATABASE_GLOBAL_DB } from '../../common/const';
import { ModelGeneral } from '../abstract/general';
import ModelUser from './user';
import { getCurrentTime } from '../../helper/common';

export interface DocumentOwnership extends Document {
  databaseName: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelOwnership extends ModelGeneral<DocumentOwnership> {
  static collectionName: string = 'ownership';

  constructor() {
    super(ZKDATABASE_GLOBAL_DB, ModelOwnership.collectionName);
  }
}

export default ModelOwnership;
