import {
  ETransactionType,
  TDatabaseRequest,
  TTransactionRequest,
  TTransactionConfirmRequest,
  databaseName,
  transactionType,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  confirmTransaction as confirmTransactionDomain,
  enqueueTransaction as enqueueTransactionDomain,
  getTransactionForSigning,
} from '../../domain/use-case/transaction.js';
import { gql } from '../../helper/common.js';
import { authorizeWrapper } from '../validation.js';

export const typeDefsTransaction = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type Transaction {
    databaseName: String!
    transactionType: TransactionType!
    status: TransactionStatus!
    txHash: String!
    error: String!
  }

  extend type Query {
    getTransaction(
      databaseName: String!
      transactionType: TransactionType!
    ): DbTransaction!
  }

  extend type Mutation {
    enqueueDeployTransaction(databaseName: String!): String!

    confirmTransaction(databaseName: String!, txHash: String!): Boolean
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
      transactionObjectId: transaction._id,
      databaseName: transaction.databaseName,
      zkAppPublickey: transaction.zkAppPublicKey,
      transactionType: transaction.transactionType,
      transactionStatus: transaction.status,
      txHash: transaction.txHash,
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
