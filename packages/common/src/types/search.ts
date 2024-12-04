/**
 * Search operator
 * @enum {string}
 * @property {string} Eq - Equal
 * @property {string} Ne - Not equal
 * @property {string} Gt - Greater than
 * @property {string} Lt - Less than
 * @property {string} Gte - Greater than or equal
 * @property {string} Lte - Less than or equal
 * @property {string} Contain - Contain
 */
export enum ESearchOperator {
  Eq = 'Eq',
  Ne = 'Ne',
  Gt = 'Gt',
  Lt = 'Lt',
  Gte = 'Gte',
  Lte = 'Lte',
  Contain = 'Contain',
}

export type TCondition<T> = {
  field: keyof T;
  value: any;
  operator: ESearchOperator;
};

export type SearchInput<T> = {
  and?: SearchInput<T>[];
  or?: SearchInput<T>[];
  condition?: TCondition<T>;
};

export type QueryOption<T> = {
  where?: SearchInput<T>;
};
