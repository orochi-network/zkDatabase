import { Transaction } from '@domain';
import { gql } from '@helper';
import {
  databaseName,
  ETransactionType,
  transactionType,
  TTransactionDeployEnqueueRequest,
  TTransactionDeployEnqueueResponse,
  TTransactionDraftRequest,
  TTransactionDraftResponse,
  TTransactionSubmitRequest,
  TTransactionSubmitResponse,
} from '@zkdb/common';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';

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
    transactionRaw: String!
    txHash: String
    error: String
    createdAt: Date!
    updatedAt: Date!
  }

  extend type Query {
    transactionDraft(
      databaseName: String!
      transactionType: TransactionType!
    ): Transaction
  }

  extend type Mutation {
    transactionDeployEnqueue(databaseName: String!): String!

    transactionSubmit(
      databaseName: String!
      transactionObjectId: String!
      txHash: String!
    ): Boolean!
  }
`;

const transactionDraft = authorizeWrapper<
  TTransactionDraftRequest,
  TTransactionDraftResponse
>(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root, args, ctx) => {
    const transaction = await Transaction.draft(
      args.databaseName,
      ctx.userName,
      args.transactionType
    );

    if (!transaction) {
      return null;
    }

    return {
      ...transaction,
      _id: transaction._id.toString(),
    };
  }
);

const transactionDeployEnqueue = authorizeWrapper<
  TTransactionDeployEnqueueRequest,
  TTransactionDeployEnqueueResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, args, ctx) =>
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

const transactionSubmit = authorizeWrapper<
  TTransactionSubmitRequest,
  TTransactionSubmitResponse
>(
  Joi.object({
    databaseName,
    transactionObjectId: Joi.string().required(),
    txHash: Joi.string().required(),
  }),
  async (_root, args, ctx) =>
    Transaction.submit(
      args.databaseName,
      ctx.userName,
      args.transactionObjectId,
      args.txHash
    )
);

export const resolversTransaction = {
  JSON: GraphQLJSON,
  Query: {
    transactionDraft,
  },
  Mutation: {
    transactionDeployEnqueue,
    transactionSubmit,
  },
};
