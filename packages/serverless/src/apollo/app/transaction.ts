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
  getTransactionDraft,
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
    rawTransaction: String!
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

    transactionConfirm(databaseName: String!, txHash: String!): Boolean
  }
`;

const transactionDraft = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TTransactionRequest, ctx) => {
    const transaction = await getTransactionDraft(
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

const transactionDeployEnqueue = authorizeWrapper(
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

const transactionConfirm = authorizeWrapper(
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
