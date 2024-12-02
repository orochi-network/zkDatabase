import { ProvableTypeString } from '../domain/common/schema.js';
import { ESorting } from './collection.js';

export type TSchemaField = {
  order: number;
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type TSchemaFieldInput = Omit<TSchemaField, 'order'> & {
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
