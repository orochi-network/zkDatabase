import { optional } from 'joi';
import { O1DataType } from '../common/o1js';
import { PermissionRecord } from '../common/permission';
import { ZKDatabaseIndex } from './abstract/database-engine';
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

export type SchemaDocument = SchemaBasic & ZKDatabaseIndex;

export class ModelSchema extends ModelDocument {}
