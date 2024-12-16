import {
  TDatabaseChangeOwnerRequest,
  TDatabaseCreateRequest,
  TDatabaseListRequest,
  TDatabaseUpdateDeployedRequest,
} from '@types';
import { pagination, userName } from '@validation';
import Joi from 'joi';
import { ObjectId } from 'mongodb';

export const databaseName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[_a-z0-9]+/i);
export const merkleHeight = Joi.number().integer().positive().required();

const SchemaDatabaseRecordQuery = Joi.object<TDatabaseListRequest['query']>({
  databaseName: Joi.string().optional(),
  databaseOwner: Joi.string().optional(),
  merkleHeight: Joi.number().integer().optional(),
  appPublicKey: Joi.string().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  _id: Joi.custom((value, helpers) => {
    if (!ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }).optional(),
});

export const JOI_DATABASE_LIST = Joi.object<TDatabaseListRequest>({
  query: SchemaDatabaseRecordQuery.optional(),
  pagination,
});

export const JOI_DATABASE_CREATE = Joi.object<TDatabaseCreateRequest>({
  databaseName,
  merkleHeight,
});

export const JOI_DATABASE_UPDATE_DEPLOY =
  Joi.object<TDatabaseUpdateDeployedRequest>({
    databaseName,
    appPublicKey: Joi.string()
      .trim()
      .length(55)
      .required()
      .pattern(/^[A-HJ-NP-Za-km-z1-9]{55}$/),
  });

export const JOI_DATABASE_TRANSFER_OWNER =
  Joi.object<TDatabaseChangeOwnerRequest>({
    databaseName,
    newOwner: userName,
  });
