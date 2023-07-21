import GraphQLJSON from 'graphql-type-json';
import loader from '../../helper/loader.js';

export interface IMetadataResponse {
  [key: string]: string;
}

// The GraphQL schema
export const typeDefsMetadata = `#graphql
  scalar JSON

  type Query {
      getMetadata(): JSON
  }
`;

// A map of functions which return data for the schema.
export const resolversMetadata = {
  JSON: GraphQLJSON,
  Query: {
    getMetadata: async (): Promise<IMetadataResponse> => {
      const metadata = await loader.getMetadata();
      return metadata.collection.toJSON();
    },
  },
};
