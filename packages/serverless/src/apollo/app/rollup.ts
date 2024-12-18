import { Rollup } from '@domain';
import {
  databaseName,
  TRollUpCreateRequest,
  TRollUpCreateResponse,
  TRollupHistoryRequest,
  TRollUpHistoryResponse,
} from '@zkdb/common';
import { withCompoundTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';

export const typeDefsRollUp = `#graphql
scalar Date
type Mutation

enum RollUpState {
  Updated
  Updating
  Outdated
  Failed
}

# @TODO: Refactor rollup
type RollUpHistoryItem {
  databaseName: String!
  transactionType: TransactionType!
  txHash: String
  transactionRaw: String!
  status: TransactionStatus!
  merkletreeRoot: String!
  merkletreeRootPrevious: String!
  error: String
  createdAt: Date!
  updatedAt: Date!
}

type RollUpHistory {
  state: RollUpState!,
  extraData: Int,
  history: [RollUpHistoryItem]!
}

extend type Mutation {
  rollupCreate(databaseName: String!): Boolean
  
  rollupHistory(databaseName: String!): RollUpHistory!
}
`;

const rollupHistory = authorizeWrapper<
  TRollupHistoryRequest,
  TRollUpHistoryResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }) => Rollup.history(databaseName)
);

const rollupCreate = authorizeWrapper<
  TRollUpCreateRequest,
  TRollUpCreateResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }, ctx) => {
    const result = await withCompoundTransaction((compoundSession) =>
      Rollup.create(databaseName, ctx.userName, compoundSession)
    );
    return result === null ? false : result;
  }
);

export const resolversRollUp = {
  JSON: GraphQLJSON,
  Mutation: {
    rollupHistory,
    rollupCreate,
  },
};
