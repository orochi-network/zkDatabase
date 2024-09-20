export type TCondition = {
  field: string;
  value: string;
  operator: string;
};

export type TSearch = {
  and?: [TSearch];
  or?: [TSearch];
  condition?: TCondition;
};
