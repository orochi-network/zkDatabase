import {
  ETransactionType,
  TDatabaseRequest,
  TTransactionRequest,
  TTransactionConfirmRequest,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  confirmTransaction as confirmTransactionDomain,
  enqueueTransaction as enqueueTransactionDomain,
  getUnsignedTransaction as getUnsignedTransactionDomain,
} from '../../domain/use-case/transaction.js';
import { gql } from '../../helper/common.js';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';

export const typeDefsTransaction = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type Transaction {
    _id: String!
    databaseName: String!
    transactionType: TransactionType!
    status: TransactionStatus!
    tx: String!
    txHash: String!
    error: String!
    createdAt: Date!
    updatedAt: Date!
  }

  extend type Query {
    getUnsignedTransaction(
      databaseName: String!
      transactionType: TransactionType!
    ): Transaction!
  }

  extend type Mutation {
    enqueueDeployTransaction(databaseName: String!): String!

    confirmTransaction(databaseName: String!, txHash: String!): Boolean
  }
`;

const getUnsignedTransaction = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionRequest, ctx) => {
    const transaction = await getUnsignedTransactionDomain(
      args.databaseName,
      ctx.userName,
      args.transactionType
    );

    return {
      ...transaction,
      _id: transaction._id.toString(),
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
    await confirmTransactionDomain(args.databaseName, ctx.userName, args.txHash)
);

type TTransactionResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getUnsignedTransaction: typeof getUnsignedTransaction;
  };
  Mutation: {
    enqueueDeployTransaction: typeof enqueueDeployTransaction;
    confirmTransaction: typeof confirmTransaction;
  };
};

export const resolversTransaction: TTransactionResolver = {
  JSON: GraphQLJSON,
  Query: {
    getUnsignedTransaction,
  },
  Mutation: {
    enqueueDeployTransaction,
    confirmTransaction,
  },
};
