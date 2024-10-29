import Joi from 'joi';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';
import { TDatabaseRequest } from './database.js';
import {
  enqueueTransaction as enqueueTransactionDomain,
  getTransaction as getTransactionDomain,
} from '../../domain/use-case/transaction.js';
import GraphQLJSON from 'graphql-type-json';

export const typeDefsTransaction = `#graphql
scalar JSON
type Query
type Mutation

enum TransactionType {
  deploy
  rollup
}

extend type Query {
  getTransaction(databaseName: String!, transactionType: TransactionType!): JSON
}

extend type Mutation {
  enqueueTransaction(databaseName: String!, transactionType: TransactionType!)
}
`;

export type TTransactionRequest = TDatabaseRequest & {
  transactionType: 'deploy' | 'rollup';
};

const getTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionRequest, ctx) =>
    getTransactionDomain(args.databaseName, ctx.userName, args.transactionType)
);

const enqueueTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionRequest, ctx) =>
    enqueueTransactionDomain(
      args.databaseName,
      ctx.userName,
      args.transactionType
    )
);

type TTransactionResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getTransaction: typeof getTransaction;
  };
  Mutation: {
    enqueueTransaction: typeof enqueueTransaction;
  };
};

export const resolversTransaction: TTransactionResolver = {
  JSON: GraphQLJSON,
  Query: {
    getTransaction,
  },
  Mutation: {
    enqueueTransaction,
  },
};
