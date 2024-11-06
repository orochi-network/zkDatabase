import Joi from 'joi';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';
import { TDatabaseRequest } from './database.js';
import {
  enqueueTransaction as enqueueTransactionDomain,
  getTransactionForSigning,
  confirmTransaction as confirmTransactionDomain,
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

type DbTransaction {
  databaseName: String!
  transactionType: TransactionType!
  zkAppPublicKey: String!
  tx: String!
}

extend type Query {
  getTransaction(databaseName: String!, transactionType: TransactionType!): DbTransaction!
}

extend type Mutation {
  enqueueTransaction(databaseName: String!, transactionType: TransactionType!): Boolean
  confirmTransaction(databaseName: String!, transactionType: TransactionType!, txHash: String!): Boolean
}
`;

export type TTransactionRequest = TDatabaseRequest & {
  transactionType: 'deploy' | 'rollup';
};

export type TTransactionConfirmRequest = TTransactionRequest & {
  txHash: string;
};

const getTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionRequest, ctx) =>
    getTransactionForSigning(args.databaseName, ctx.userName, args.transactionType)
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

const confirmTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionConfirmRequest, ctx) =>
    confirmTransactionDomain(
      args.databaseName,
      ctx.userName,
      args.transactionType,
      args.txHash
    )
);

type TTransactionResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getTransaction: typeof getTransaction;
  };
  Mutation: {
    enqueueTransaction: typeof enqueueTransaction;
    confirmTransaction: typeof confirmTransaction;
  };
};

export const resolversTransaction: TTransactionResolver = {
  JSON: GraphQLJSON,
  Query: {
    getTransaction,
  },
  Mutation: {
    enqueueTransaction,
    confirmTransaction,
  },
};
