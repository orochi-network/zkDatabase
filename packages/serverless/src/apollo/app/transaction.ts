import Joi from 'joi';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';
import { TDatabaseRequest } from './database.js';
import {
  enqueueTransaction as enqueueTransactionDomain,
  getTransactionForSigning,
  confirmTransaction as confirmTransactionDomain,
  getTransactionById as getTransactionByIdDomain
} from '../../domain/use-case/transaction.js';
import GraphQLJSON from 'graphql-type-json';
import { ModelDbTransaction, withTransaction } from '@zkdb/storage';

export const typeDefsTransaction = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  getTransaction(databaseName: String!, transactionType: TransactionType!): DbTransaction!
  getTransactionById(id: String!): DbTransaction
}

extend type Mutation {
  enqueueDeployTransaction(databaseName: String!): String!
  confirmTransaction(databaseName: String!, id: String!, txHash: String!): Boolean
}
`;

export type TTransactionRequest = TDatabaseRequest & {
  transactionType: 'deploy' | 'rollup';
};

export type TTransactionByIdRequest = {
  id: string;
};

export type TTransactionIdRequest = TDatabaseRequest & {
  id: string;
};

export type TTransactionConfirmRequest = TTransactionIdRequest & {
  txHash: string;
};

const getTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionRequest, ctx) => {
    const transaction = await getTransactionForSigning(
      args.databaseName,
      ctx.userName,
      args.transactionType
    );

    return {
      databaseName: transaction.databaseName,
      transactionType: transaction.transactionType,
      zkAppPublicKey: transaction.zkAppPublicKey,
      status: transaction.status,
      id: (transaction as any)._id,
      tx: transaction.tx,
    };
  }
);

const getTransactionById = authorizeWrapper(
  Joi.object({
    id: Joi.string().required(),
  }),
  async (_root: unknown, args: TTransactionByIdRequest, ctx) => withTransaction((session) => getTransactionByIdDomain(args.id, session))
);

const enqueueDeployTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    (
      await enqueueTransactionDomain(args.databaseName, ctx.userName, 'deploy')
    ).toString()
);

const confirmTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
    id: Joi.string().required(),
    txHash: Joi.string().required(),
  }),
  async (_root: unknown, args: TTransactionConfirmRequest, ctx) =>
    confirmTransactionDomain(
      args.databaseName,
      ctx.userName,
      args.id,
      args.txHash
    )
);

type TTransactionResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getTransaction: typeof getTransaction;
    getTransactionById: typeof getTransactionById;
  };
  Mutation: {
    enqueueDeployTransaction: typeof enqueueDeployTransaction;
    confirmTransaction: typeof confirmTransaction;
  };
};

export const resolversTransaction: TTransactionResolver = {
  JSON: GraphQLJSON,
  Query: {
    getTransaction,
    getTransactionById
  },
  Mutation: {
    enqueueDeployTransaction,
    confirmTransaction,
  },
};
