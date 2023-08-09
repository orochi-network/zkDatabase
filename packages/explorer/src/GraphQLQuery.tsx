import { gql } from "@apollo/client";

export const QUERY_METADATA = gql`
  query Query {
    getMetadata
  }
`;

export const QUERY_METADATA_DETAIL = gql`
  query Query($cid: String) {
    getMetadata(cid: $cid)
  }
`;
