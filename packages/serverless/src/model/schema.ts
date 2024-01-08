import { O1DataType } from '../common/o1js';
import { PermissionRecord } from '../common/permission';
import ModelDocument from './document';

export type SchemaField = {
  name: string;
  type: O1DataType;
  value: string;
};

export type SchemaBasic = {
  [key: string]: SchemaField;
};

export type SchemaDocumentIndex<T> = {
  [Property in keyof T as `${string & Property}.name`]: string;
} & {
  [Property in keyof T as `${string & Property}.type`]: O1DataType;
} & {
  [Property in keyof T as `${string & Property}.value`]: string;
};

export type SchemaPermission = {
  schema: string[];
  owner: string;
  group: string;
  ownerPermission: PermissionRecord;
  groupPermission: PermissionRecord;
  otherPermission: PermissionRecord;
};

export type SchemaDocument = SchemaBasic & SchemaPermission;

export class ModelSchema extends ModelDocument {}
