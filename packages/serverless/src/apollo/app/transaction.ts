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
import { Transaction as MongoTransaction } from '@zkdb/storage';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';

export const typeDefsTransaction = gql`
  #graphql
  type Query
  type Mutation

  type Transaction {
    rawTransactionId: String!
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
      rawTransactionId: String!
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
  async (_root, args, ctx) =>
    MongoTransaction.serverless(async (session) => {
      const transactionDraft = await Transaction.draft(
        args.databaseName,
        ctx.userName,
        args.transactionType,
        session
      );

      return transactionDraft;
    })
);

const transactionDeployEnqueue = authorizeWrapper<
  TTransactionDeployEnqueueRequest,
  TTransactionDeployEnqueueResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, args, ctx) =>
    MongoTransaction.serverless(async (session) =>
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
    rawTransactionId: Joi.string().required(),
    txHash: Joi.string().required(),
  }),
  async (_root, args, ctx) =>
    MongoTransaction.serverless(async (session) => {
      const transactionSubmit = await Transaction.submit(
        args.databaseName,
        ctx.userName,
        args.rawTransactionId,
        args.txHash,
        session
      );

      return transactionSubmit;
    })
);

export const resolversTransaction = {
  Query: {
    transactionDraft,
  },
  Mutation: {
    transactionDeployEnqueue,
    transactionSubmit,
  },
};
