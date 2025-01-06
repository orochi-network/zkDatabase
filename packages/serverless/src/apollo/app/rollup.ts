import { Rollup } from '@domain';
import {
  databaseName,
  TRollupCreateRequest,
  TRollupCreateResponse,
  TRollupHistoryRequest,
  TRollupHistoryResponse,
} from '@zkdb/common';
import { withCompoundTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';

export const typeDefsRollup = `#graphql
scalar Date
type Mutation

enum RollupState {
  Updated
  Updating
  Outdated
  Failed
}

type RollupHistoryItem {
  databaseName: String!
  txHash: String
  transactionRaw: String!
  status: TransactionStatus!
  merkleTreeRoot: String!
  merkleTreeRootPrevious: String!
  error: String
  createdAt: Date!
  updatedAt: Date!
}

type RollupHistory {
  state: RollupState,
  merkleTreeRoot: String!
  merkleTreeRootPrevious: String!
  rollUpDifferent: Int,
  history: [RollupHistoryItem]
  latestRollupSuccess: Date
}

extend type Query {
  rollupHistory(databaseName: String!): RollupHistory
}

extend type Mutation {
  rollupCreate(databaseName: String!): Boolean 
}
`;

const rollupHistory = authorizeWrapper<
  TRollupHistoryRequest,
  TRollupHistoryResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }) => Rollup.history(databaseName)
);

const rollupCreate = authorizeWrapper<
  TRollupCreateRequest,
  TRollupCreateResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }, ctx) => {
    const result = await withCompoundTransaction(async (compoundSession) =>
      Rollup.create(databaseName, ctx.userName, compoundSession)
    );
    return result === null ? false : result;
  }
);

export const resolversRollup = {
  JSON: GraphQLJSON,
  Query: {
    rollupHistory,
  },
  Mutation: {
    rollupCreate,
  },
};
