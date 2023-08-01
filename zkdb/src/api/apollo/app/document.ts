import { BSON } from 'bson';
import GraphQLJSON from 'graphql-type-json';
import loader from '../../helper/loader.js';
import Joi from 'joi';
import resolverWrapper from '../validation.js';
import { AppContext } from '../../helper/common.js';
import jwt from '../../helper/jwt.js';

export interface IResponseIPFSEntry {
  cid: string;
  collection: string;
  path: string;
}

export interface IDocumentRequest {
  collection: string;
  path: string;
}

export interface IDocumentMutation {
  collection: string;
  document: any;
}

export const requestDocument = Joi.object<IDocumentRequest>({
  collection: Joi.string().length(256).required(),
  path: Joi.string().length(512).required(),
});

export const mutationDocument = Joi.object({
  collection: Joi.string().length(256).required(),
  document: Joi.object().required(),
});

// The GraphQL schema
export const typeDefsDocument = `#graphql
  scalar JSON
  type Query
  type Mutation

  type IPFSEntry {    
    cid: String
    path: String
    collection: String
  }

  extend type Query {
    readDocument(collection: !String, path: !String): JSON
  }

  extend type Mutation {
    writeDocument(collection: !String, doc: JSON!): IPFSEntry
  }
`;

// A map of functions which return data for the schema.
export const resolversDocument = {
  JSON: GraphQLJSON,
  Query: {
    readDocument: resolverWrapper(
      requestDocument,
      async (_: any, params: IDocumentRequest): Promise<any> => {
        const ipfs = await loader.getStorageEngine();
        const docCollection =
          typeof params.collection === 'undefined'
            ? 'default'
            : params.collection;
        // Switch to collection
        ipfs.use(docCollection);
        return BSON.deserialize(await ipfs.readFile(params.path));
      }
    ),
  },
  Mutation: {
    writeDocument: resolverWrapper(
      mutationDocument,
      async (
        _: any,
        params: IDocumentMutation,
        context: AppContext
      ): Promise<IResponseIPFSEntry> => {
        await jwt.verifyZKDatabaseHeader(context.token || '');
        //const ipfs = await loader.getStorageEngine();
        throw new Error('Not implemented');
        /*
        // Switch to collection
        ipfs.use(params.collection);
        // Write BSON to IPFS
        const { cid, collection, digest, filename, basefile } =
          await ipfs.writeFile(filename, params.document);

        return {
          cid: cid.toString(),
          digest: Binary.toBase32(digest),
          collection,
          filename,
          basefile,
        };
        */
      }
    ),
  },
};
