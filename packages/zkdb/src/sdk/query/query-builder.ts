export type StringOperator = 'eq' | 'ne' | 'contains';
export type NumberOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte';

export type Condition<T> = {
  field: keyof T;
  value: T[keyof T];
  operator: OperatorFor<T[keyof T]>;
};

export type SearchInput<T> = {
  and?: SearchInput<T>[];
  or?: SearchInput<T>[];
  condition?: Condition<T>;
};

export type QueryOptions<T> = {
  where?: SearchInput<T>;
  limit?: number;
  offset?: number;
};

export type OperatorFor<T> = T extends string
  ? StringOperator
  : T extends number
    ? NumberOperator
    : never;


export class QueryBuilder<T> {
  private query: SearchInput<T> = {};
  private currentGroup: SearchInput<T>[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  where<K extends keyof T>(
    field: K,
    operator: OperatorFor<T[K]>,
    value: T[K]
  ): this {
    const condition: SearchInput<T> = {
      condition: { field, operator, value },
    };
    this.currentGroup.push(condition);
    return this;
  }

  and(): this {
    if (this.query.and) {
      this.query.and.push(...this.currentGroup);
    } else {
      this.query.and = [...this.currentGroup];
    }
    this.currentGroup = [];
    return this;
  }

  or(): this {
    if (this.query.or) {
      this.query.or.push(...this.currentGroup);
    } else {
      this.query.or = [...this.currentGroup];
    }
    this.currentGroup = [];
    return this;
  }

  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  build(): QueryOptions<T> {
    if (this.currentGroup.length) {
      if (this.query.and) {
        this.query.and.push(...this.currentGroup);
      } else if (this.query.or) {
        this.query.or.push(...this.currentGroup);
      } else {
        this.query = this.currentGroup[0];
      }
    }

    return {
      where: this.query,
      limit: this.limitValue,
      offset: this.offsetValue,
    };
  }
}
