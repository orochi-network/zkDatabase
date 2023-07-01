import { BSON } from 'bson';
import GraphQLJSON from 'graphql-type-json';
import { Binary } from '../../../utilities/index.js';
import getStorageEngine from '../../helper/ipfs-storage-engine.js';
import Joi from 'joi';
import resolverWrapper, {
  validateCID,
  validateCollection,
  validateDigest,
} from '../validation.js';

export interface IResponseIPFSEntry {
  cid: string;
  digest: string;
  collection: string;
  filename: string;
  basefile: string;
}

export interface IDocumentByCIDRequest {
  cid: string;
}

export interface IDocumentRequest {
  digest: string;
  collection?: string;
}

export const requestDocumentByCID = Joi.object<IDocumentByCIDRequest>({
  cid: validateCID.required(),
});

export const requestDocument = Joi.object<IDocumentRequest>({
  digest: validateDigest.required(),
  collection: validateCollection.optional(),
});

export const mutationDocument = Joi.object({
  doc: Joi.object().required(),
  collection: validateCollection.optional(),
});

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
    readDocumentByCID: resolverWrapper(
      requestDocumentByCID,
      async (_: any, params: any): Promise<any> => {
        const ipfs = await getStorageEngine();
        return BSON.deserialize(await ipfs.readBytes(params.cid));
      }
    ),
    readDocument: resolverWrapper(
      requestDocument,
      async (_: any, params: any): Promise<any> => {
        const ipfs = await getStorageEngine();
        const docCollection =
          typeof params.collection === 'undefined'
            ? 'default'
            : params.collection;
        // Switch to collection
        ipfs.use(docCollection);
        return BSON.deserialize(await ipfs.read(params.digest));
      }
    ),
  },
  Mutation: {
    writeDocument: resolverWrapper(
      mutationDocument,
      async (_: any, params: any): Promise<IResponseIPFSEntry> => {
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
      }
    ),
  },
};
