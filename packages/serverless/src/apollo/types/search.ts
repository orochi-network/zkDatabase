export type Condition = {
  field: string;
  value: string;
  operator: string;
};

export type Search = {
  and: [Search];
  or: [Search];
  condition: Condition;
};