import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { gql } from '../../helper/common.js';
import config from '../../helper/config.js';
import publicWrapper from '../validation.js';

export const typeDefsEnvironment = gql`
  #graphql
  scalar JSON
  type Query

  enum ENetworkId {
    testnet
    mainnet
  }

  type EnvironmentInfo {
    networkId: ENetworkId!
    networkUrl: String!
  }

  extend type Query {
    getEnvironment: EnvironmentInfo!
  }
`;

// Query
const getEnvironment = publicWrapper(
  Joi.object({}),
  async (_root: unknown, _) => {
    return {
      networkId: config.NETWORK_ID,
      networkUrl: config.MINA_URL,
    };
  }
);

type TEnvironmentResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getEnvironment: typeof getEnvironment;
  };
  Mutation: {};
};

export const resolversEnvironment: TEnvironmentResolver = {
  JSON: GraphQLJSON,
  Query: {
    getEnvironment,
  },
  Mutation: {},
};
