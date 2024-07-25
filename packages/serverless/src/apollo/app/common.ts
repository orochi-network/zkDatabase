import Joi from 'joi';
import { PermissionRecord } from '../../common/permission';
import { O1JS_VALID_TYPE } from '../../common/const';
import { TDocumentField } from '../types/document';

export const objectId = Joi.string()
  .trim()
  .min(24)
  .max(24)
  .required()
  .pattern(/^[a-f0-9]+/i);

export const databaseName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[_a-z0-9]+/i);

export const userName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[._a-z0-9]+/i);

export const collectionName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[_a-z0-9]+/i);

export const groupName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[_a-z0-9]+/i);

export const groupDescription = Joi.string()
  .trim()
  .min(10)
  .max(256)
  .required();
 
export const groupOptionalDescription = Joi.string()
  .allow('')
  .optional()
  .description(
    'Optional description of the group, providing additional context.'
  );

export const publicKey = Joi.string()
  .trim()
  .length(55)
  .required()
  .pattern(/^[A-HJ-NP-Za-km-z1-9]{55}$/);

export const indexName = Joi.string()
  .trim()
  .min(2)
  .max(128)
  .required()
  .pattern(/^[_a-z]+[_a-z0-9]+/i);

export const indexNumber = Joi.string()
  .regex(/^[0-9]+$/)
  .required();

export const indexField = Joi.array().items(Joi.string().required());

export const permissionRecord = Joi.object<PermissionRecord>({
  system: Joi.boolean(),
  create: Joi.boolean(),
  read: Joi.boolean(),
  write: Joi.boolean(),
  delete: Joi.boolean(),
});

export const permissionDetail = Joi.object({
  permissionOwner: permissionRecord,
  permissionGroup: permissionRecord,
  permissionOthers: permissionRecord,
});

export const documentField = Joi.object<TDocumentField>({
  name: Joi.string()
    .pattern(/^[a-z][a-zA-Z0-9\\_]+$/)
    .required(),
  kind: Joi.string()
    .valid(...O1JS_VALID_TYPE)
    .required(),
  value: Joi.string().raw().required(),
});
