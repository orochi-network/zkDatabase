export enum ESearchOperator {
  Eq,
  Ne,
  Gt,
  Lt,
  Gte,
  Lte,
  Contain,
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
