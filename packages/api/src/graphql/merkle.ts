import { gql } from "@apollo/client";
import {
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
import { createApi, TApolloClient } from "./common";

export const API_MERKLE = <T>(client: TApolloClient<T>) => ({
  merkleNodeByLevel: createApi<
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
            index
            level
            hash
            empty
          }
          totalSize
          offset
        }
      }
    `,
    ({ total, data, offset }) => ({
      total,
      offset,
      data: data.map(({ index, ...e }) => ({
        ...e,
        index: BigInt(index),
      })),
    })
  ),
  merkleNodeChildren: createApi<
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
    (res) =>
      res.map(({ index, ...e }) => ({
        ...e,
        index: BigInt(index),
      }))
  ),
  merkleNodePath: createApi<
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
    (res) =>
      res.map(({ index, ...e }) => ({
        ...e,
        index: BigInt(index),
      }))
  ),
  merkleProof: createApi<
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
    `
  ),
  merkleProofDocId: createApi<
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
    `
  ),
  merkleTreeInfo: createApi<TMerkleTreeInfoRequest, TMerkleTreeInfoResponse>(
    client,
    gql`
      query merkleTreeInfo($databaseName: String!) {
        merkleTreeInfo(databaseName: $databaseName) {
          merkleRoot
          merkleHeight
        }
      }
    `
  ),
});

export default API_MERKLE;
