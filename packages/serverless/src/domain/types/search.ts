export type Condition<T> = {
  field: keyof T;
  value: any;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
};

export type SearchInput<T> = {
  and?: SearchInput<T>[];
  or?: SearchInput<T>[];
  condition?: Condition<T>;
};

export type QueryOptions<T> = {
  where?: SearchInput<T>;
};
