import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { getRollupInfo } from '../../domain/use-case/rollup.js';
import { authorizeWrapper } from '../validation.js';
import { databaseName } from './common.js';

export const typeDefsTransaction = `#graphql
scalar JSON
type Query
type Mutation

enum TransactionType {
  deploy
  rollup
}

type DbTransaction {
  databaseName: String!
  transactionType: TransactionType!
  zkAppPublicKey: String!
  tx: String!
}

extend type Query {
  getRollup(databaseName: String!): DbTransaction!
}

extend type Mutation {}
`;

export type TGetRollupRequest = {
  databaseName: string;
};

const getRollup = authorizeWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TGetRollupRequest, ctx) =>
    getRollupInfo(args.databaseName, ctx.userName)
);

type TRollupResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getRollup: typeof getRollup;
  };
  Mutation: {};
};

export const resolversTransaction: TRollupResolver = {
  JSON: GraphQLJSON,
  Query: {
    getRollup,
  },
  Mutation: {},
};
