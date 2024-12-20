import { gql } from "@apollo/client";
import {
  TCollectionMetadata,
  TCollectionMetadataRequest,
  TDocumentMetadata,
  TDocumentMetadataRequest,
} from "@zkdb/common";
import { createQueryFunction, TApolloClient } from "./common";

// TODO: Finish when serverless done
const METADATA_DOCUMENT = gql``;

const METADATA_COLLECTION = gql``;

export const metadata = <T>(client: TApolloClient<T>) => ({
  document: createQueryFunction<
    TDocumentMetadata,
    TDocumentMetadataRequest,
    { documentMetadata: TDocumentMetadata }
  >(client, METADATA_DOCUMENT, (data) => data),
  collection: createQueryFunction<
    TCollectionMetadata,
    TCollectionMetadataRequest,
    { collectionMetadata: TCollectionMetadata }
  >(client, METADATA_COLLECTION, (data) => data),
});
