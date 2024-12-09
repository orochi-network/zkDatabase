import { TDatabaseRequest, databaseName, transactionType } from '@zkdb/common';
import { withCompoundTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createRollUp as createRollUpDomain,
  getRollUpHistory as getRollUpHistoryDomain,
} from '../../domain/use-case/rollup.js';
import { authorizeWrapper } from '../validation.js';

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
  merkletreeRootCurrent: String!
  merkletreeRootPrevious: String!
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
  getRollUpHistory(databaseName: String!): RollUpHistory!
  createRollUp(databaseName: String!): Boolean
}
`;

const getRollUpHistory = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    getRollUpHistoryDomain(args.databaseName)
);

const createRollUp = authorizeWrapper(
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
    getRollUpHistory: typeof getRollUpHistory;
    createRollUp: typeof createRollUp;
  };
};

export const resolversRollUp: TRollUpResolver = {
  JSON: GraphQLJSON,
  Mutation: {
    getRollUpHistory,
    createRollUp,
  },
};
