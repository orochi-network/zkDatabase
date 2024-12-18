import {
  ETransactionType,
  TDatabaseRequest,
  TTransactionRequest,
  TTransactionConfirmRequest,
  databaseName,
  transactionType,
  TTransactionWithId,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Transaction } from '@domain';
import { gql } from '@helper';
import { authorizeWrapper } from '../validation';
import { withTransaction } from '@zkdb/storage';

export const typeDefsTransaction = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type Transaction {
    transactionObjectId: String!
    databaseName: String!
    transactionType: TransactionType!
    status: TransactionStatus!
    transactionRaw: String!
    txHash: String!
    error: String!
    createdAt: Date!
    updatedAt: Date!
  }

  extend type Query {
    transactionDraft(
      databaseName: String!
      transactionType: TransactionType!
    ): Transaction!
  }

  extend type Mutation {
    transactionDeployEnqueue(databaseName: String!): String!

    transactionConfirm(
      databaseName: String!
      transactionObjectId: String!
      txHash: String!
    ): Boolean
  }
`;

const transactionDraft = authorizeWrapper<
  TTransactionRequest,
  TTransactionWithId
>(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionRequest, ctx) => {
    const transaction = await Transaction.draft(
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

const transactionDeployEnqueue = authorizeWrapper<TDatabaseRequest, string>(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    withTransaction(async (session) =>
      (
        await Transaction.enqueue(
          args.databaseName,
          ctx.userName,
          ETransactionType.Deploy,
          session
        )
      ).toString()
    )
);

const transactionConfirm = authorizeWrapper<
  TTransactionConfirmRequest,
  boolean
>(
  Joi.object({
    databaseName,
    transactionObjectId: Joi.string().required(),
    txHash: Joi.string().required(),
  }),
  async (_root: unknown, args: TTransactionConfirmRequest, ctx) =>
    Transaction.confirm(
      args.databaseName,
      ctx.userName,
      args.transactionObjectId,
      args.txHash
    )
);

type TTransactionResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    transactionDraft: typeof transactionDraft;
  };
  Mutation: {
    transactionDeployEnqueue: typeof transactionDeployEnqueue;
    transactionConfirm: typeof transactionConfirm;
  };
};

export const resolversTransaction: TTransactionResolver = {
  JSON: GraphQLJSON,
  Query: {
    transactionDraft,
  },
  Mutation: {
    transactionDeployEnqueue,
    transactionConfirm,
  },
};
