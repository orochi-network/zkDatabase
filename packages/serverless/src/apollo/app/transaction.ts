import {
  ETransactionType,
  TDatabaseRequest,
  TTransactionConfirmRequest,
  TTransactionRequest,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  confirmTransaction as confirmTransactionDomain,
  enqueueTransaction as enqueueTransactionDomain,
  getTransactionForSigning,
} from '../../domain/use-case/transaction.js';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';

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
  status: TransactionStatus!
  tx: String!
  id: String!
}

extend type Query {
  getTransaction(databaseName: String!, transactionType: TransactionType!): DbTransaction!
}

extend type Mutation {
  enqueueDeployTransaction(databaseName: String!): String!
  confirmTransaction(databaseName: String!, id: String!, txHash: String!): Boolean
}
`;

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

const enqueueDeployTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    (
      await enqueueTransactionDomain(
        args.databaseName,
        ctx.userName,
        ETransactionType.Deploy
      )
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
  },
  Mutation: {
    enqueueDeployTransaction,
    confirmTransaction,
  },
};
