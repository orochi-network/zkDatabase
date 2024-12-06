import { TDatabaseRequest } from '@zkdb/common';
import { withCompoundTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createRollUp as createRollUpDomain,
  getRollUpHistory as getRollUpHistoryDomain,
} from '../../domain/use-case/rollup.js';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';

export const typeDefsRollUp = `#graphql
scalar Date
type Mutation

enum RollUpState {
  updated
  outdated
  failed
}

type RollUpHistoryItem {
  databaseName: String!
  transactionType: TransactionType!
  txHash: String
  rawTransaction: String!
  status: TransactionStatus!
  currentMerkleTreeRoot: String!
  previousMerkleTreeRoot: String!
  createdAt: Date!
  updatedAt: Date!
  error: String
}

type RollUpHistory {
  state: RollUpState!,
  extraData: Int,
  history: [RollUpHistoryItem]!
}

extend type Mutation {
  rollUpCreate(databaseName: String!): RollUpHistory!
  rollUpHistoryAdd(databaseName: String!): Boolean
}
`;

const rollUpHistory = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    getRollUpHistoryDomain(args.databaseName)
);

const rollUpCreate = authorizeWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    withCompoundTransaction((compoundSession) =>
      createRollUpDomain(args.databaseName, ctx.userName, compoundSession)
    )
);

type TRollUpResolver = {
  JSON: typeof GraphQLJSON;
  Mutation: {
    rollUpHistory: typeof rollUpHistory;
    rollUpCreate: typeof rollUpCreate;
  };
};

export const resolversRollUp: TRollUpResolver = {
  JSON: GraphQLJSON,
  Mutation: {
    rollUpHistory,
    rollUpCreate,
  },
};
