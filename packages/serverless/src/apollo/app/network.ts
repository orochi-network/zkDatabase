import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import publicWrapper from '../validation.js';
import { getNetworks as getNetworksDomain } from '../../domain/use-case/network.js';

/* eslint-disable import/prefer-default-export */
export const typeDefsNetwork = `#graphql
scalar JSON
type Query

type Network {
  id: String!
  endpoint: String!
  active: Boolean!
}

extend type Query {
  getNetworks: [Network]!
}
`;

const getNetworks = publicWrapper(
  Joi.object().unknown(),
  async (_root: unknown, args: any) => getNetworksDomain()
);

type TNetworkResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getNetworks: typeof getNetworks;
  };
};

export const resolversNetwork: TNetworkResolver = {
  JSON: GraphQLJSON,
  Query: {
    getNetworks,
  },
};
