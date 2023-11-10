import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { AppContext } from '../../helper/common';

export interface IHello {
  name: string;
}

export const joiHello = Joi.object<IHello>({
  name: Joi.string().required().max(200),
});

export const typeDefsHello = `#graphql
  scalar JSON
  type Query

  extend type Query {
    hello(name: String!): String
  }
`;

export const resolversHello = {
  JSON: GraphQLJSON,
  Query: {
    hello: resolverWrapper(
      joiHello,
      async (_root: unknown, args: IHello, context: AppContext) => {
        return `Hello ${args.name}!`;
      }
    ),
  },
};

export type TData = {
  name: string;
  age: number;
};

export type TData2 = {
  age: number;
  membership: boolean;
};

export type TRecord<T> = {
  [P in keyof T]: string;
};

export interface IRecordList<T> {
  data: T[];
  total: number;
  get(index: number): T;
}

export class Test1 implements IRecordList<string> {
  public data: string[] = [];

  public total: number = 0;

  get(index: number): string {
    return this.data[index];
  }
}

export type TRecordDataString = TRecord<TData>;

export type TRecordDataName = Pick<TRecord<TData>, 'name'>;

export interface Test2 {
  name: string;
  get(): string;
}

export interface Test3 extends Test2 {
  set: (name: string) => void;
}

let a: Test3 = {
  name: '',
  get() {
    return '';
  },
  set(name: string) {},
};

export type Type1 = {
  name: string;
};

export type Type2 = Type1 & {
  age: number;
};

let a1: Type2 = {
  name: '',
  age: 1,
};
