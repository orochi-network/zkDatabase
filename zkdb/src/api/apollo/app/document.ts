import { BSON } from 'bson';
import GraphQLJSON from 'graphql-type-json';
import { Binary } from '../../../utilities/index.js';
import getStorageEngine from '../../helper/ipfs-storage-engine.js';

export interface IResponseIPFSEntry {
  cid: string;
  digest: string;
  collection: string;
  filename: string;
  basefile: string;
}

// The GraphQL schema
export const typeDefsDocument = `#graphql
  scalar JSON
  type Query
  type Mutation

  type IPFSEntry {    
    cid: String
    digest: String
    collection: String
    filename: String
    basefile: String
  }

  extend type Query {
    readDocumentByCID(cid: String!): JSON
    readDocument(digest: String!, collection: String): JSON
  }

  extend type Mutation {
    writeDocument(doc: JSON!, collection: String): IPFSEntry
  }
`;

// A map of functions which return data for the schema.
export const resolversDocument = {
  JSON: GraphQLJSON,
  Query: {
    readDocumentByCID: async (_: any, params: any): Promise<any> => {
      const ipfs = await getStorageEngine();
      return BSON.deserialize(await ipfs.readBytes(params.cid));
    },
    readDocument: async (_: any, params: any): Promise<any> => {
      const ipfs = await getStorageEngine();
      const docCollection =
        typeof params.collection === 'undefined'
          ? 'default'
          : params.collection;
      // Switch to collection
      ipfs.use(docCollection);
      return BSON.deserialize(await ipfs.read(params.digest));
    },
  },
  Mutation: {
    writeDocument: async (_: any, params: any): Promise<IResponseIPFSEntry> => {
      const ipfs = await getStorageEngine();
      const docCollection =
        typeof params.collection === 'undefined'
          ? 'default'
          : params.collection;
      // Switch to collection
      ipfs.use(docCollection);
      // Write BSON to IPFS
      const { cid, collection, digest, filename, basefile } =
        await ipfs.writeBSON(params.doc);

      return {
        cid: cid.toString(),
        digest: Binary.toBase32(digest),
        collection,
        filename,
        basefile,
      };
    },
  },
};
