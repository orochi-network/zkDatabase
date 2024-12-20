import { gql } from "@apollo/client";
import {
  TMetadataCollection,
  TMetadataCollectionRequest,
  TMetadataDocument,
  TMetadataDocumentRequest,
} from "@zkdb/common";
import { createQueryFunction, TApolloClient } from "./common";

// TODO: Finish when serverless done
const METADATA_DOCUMENT = gql``;

const METADATA_COLLECTION = gql``;

export const metadata = <T>(client: TApolloClient<T>) => ({
  document: createQueryFunction<
    TMetadataDocument,
    TMetadataDocumentRequest,
    { documentMetadata: TMetadataDocument }
  >(client, METADATA_DOCUMENT, (data) => data),
  collection: createQueryFunction<
    TMetadataCollection,
    TMetadataCollectionRequest,
    { collectionMetadata: TMetadataCollection }
  >(client, METADATA_COLLECTION, (data) => data),
});
