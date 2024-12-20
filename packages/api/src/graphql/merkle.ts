import { gql } from "@apollo/client";
import {
  TDatabaseRequest,
  TMerkleProof,
  TMerkleTreeInfoRequest,
  TMerkleTreeInfoResponse,
  TMerkleTreeNodeChildrenRequest,
  TMerkleTreeNodeChildrenResponse,
  TMerkleTreeNodeListByLevelRequest,
  TMerkleTreeNodeListByLevelResponse,
  TMerkleTreeNodePathRequest,
  TMerkleTreeNodePathResponse,
  TMerkleTreeProofByDocIdRequest,
  TMerkleTreeProofByDocIdResponse,
  TMerkleTreeProofByIndexRequest,
  TMerkleTreeProofByIndexResponse,
} from "@zkdb/common";
import { createQueryFunction, TApolloClient } from "./common";

export const merkle = <T>(client: TApolloClient<T>) => ({
  merkleNodeByLevel: createQueryFunction<
    TMerkleTreeNodeListByLevelRequest,
    TMerkleTreeNodeListByLevelResponse
  >(
    client,
    gql`
      query merkleNodeByLevel(
        $databaseName: String!
        $level: Int!
        $pagination: PaginationInput
      ) {
        merkleNodeByLevel(
          databaseName: $databaseName
          level: $level
          pagination: $pagination
        ) {
          data {
            ...MerkleNodeFragment
          }
          totalSize
          offset
        }
      }
    `,
    (data) => data.merkleNodeByLevel
  ),
  merkleNodeChildren: createQueryFunction<
    TMerkleTreeNodeChildrenRequest,
    TMerkleTreeNodeChildrenResponse
  >(
    client,
    gql`
      query merkleNodeChildren(
        $databaseName: String!
        $level: Int!
        $index: String!
      ) {
        merkleNodeChildren(
          databaseName: $databaseName
          level: $level
          index: $index
        ) {
          index
          level
          hash
          empty
        }
      }
    `,
    (data) => data.merkleNodeChildren
  ),
  merkleNodePath: createQueryFunction<
    TMerkleTreeNodePathRequest,
    TMerkleTreeNodePathResponse
  >(
    client,
    gql`
      query merkleNodePath($databaseName: String!, $docId: String!) {
        merkleNodePath(databaseName: $databaseName, docId: $docId) {
          index
          level
          hash
          witness
          target
        }
      }
    `,
    (data) => data.merkleNodePath
  ),
  merkleProof: createQueryFunction<
    TMerkleTreeProofByIndexRequest,
    TMerkleTreeProofByIndexResponse
  >(
    client,
    gql`
      query merkleProof($databaseName: String!, $index: String!) {
        merkleProof(databaseName: $databaseName, index: $index) {
          isLeft
          sibling
        }
      }
    `,
    (data) => data.merkleProof
  ),
  merkleProofDocId: createQueryFunction<
    TMerkleTreeProofByDocIdRequest,
    TMerkleTreeProofByDocIdResponse
  >(
    client,
    gql`
      query merkleProofDocId($databaseName: String!, $docId: String!) {
        merkleProofDocId(databaseName: $databaseName, docId: $docId) {
          isLeft
          sibling
        }
      }
    `,
    (data) => data.merkleProofDocId
  ),
  merkleTreeInfo: createQueryFunction<
    TMerkleTreeInfoRequest,
    TMerkleTreeInfoResponse
  >(
    client,
    gql`
      query merkleTreeInfo($databaseName: String!) {
        merkleTreeInfo(databaseName: $databaseName) {
          merkleRoot
          merkleHeight
        }
      }
    `,
    (data) => data.merkleTreeInfo
  ),
});
