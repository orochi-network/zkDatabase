import { TProvableTypeString, TSchemaField } from '../schema.js';
import { ESorting } from './collection.js';

export type TSchemaFieldWithOrder = TSchemaField & {
  order: number;
  name: string;
};

export type TSchemaFieldInput = TSchemaField & {
  sorting?: ESorting;
};

/** Mapping type of schema to index
 * Example:
 * ```ts
 * const field = {
 *     name: 'user',
 *     kind: 'CircuitString',
 *     indexed: true,
 *     sorting: 'Asc',
 * }
 * // Will be converted to:
 * {
 *     'user.name': 'Asc',
 * }
 * ```
 */
export type TSchemaIndex<T> = {
  [Property in keyof T as `${string & Property}.name`]: ESorting;
};
