import { TDatabaseCreateRequest, TDatabaseListRequest } from '@types';
import { pagination } from '@validation';
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

export const DatabaseListRequest = Joi.object<TDatabaseListRequest>({
  query: SchemaDatabaseRecordQuery.optional(),
  pagination,
});

export const DatabaseCreateRequest = Joi.object<TDatabaseCreateRequest>({
  databaseName,
  merkleHeight,
});
