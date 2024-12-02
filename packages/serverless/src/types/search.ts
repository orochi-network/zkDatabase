export type TCondition<T> = {
  field: keyof T;
  value: any;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contain';
};

export type SearchInput<T> = {
  and?: SearchInput<T>[];
  or?: SearchInput<T>[];
  condition?: TCondition<T>;
};

export type QueryOption<T> = {
  where?: SearchInput<T>;
};
