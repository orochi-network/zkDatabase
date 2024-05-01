import { DocumentEncoded } from '../../core/schema.js';
import { Permissions } from '../../types/permission.js';
import { query, mutate } from '../graphql-client.js';
import { MerkleWitness } from '../types/merkle-tree.js';

export interface PermissionRecord {
  system?: boolean;
  create?: boolean;
  read?: boolean;
  write?: boolean;
  delete?: boolean;
}

export interface PermissionDetail {
  permissionOwner?: PermissionRecord;
  permissionGroup?: PermissionRecord;
  permissionOthers?: PermissionRecord;
}

export interface FindDocumentResponse {
  _id: string;
  document: DocumentEncoded;
}

export interface CreateDocumentResponse {
  witness: MerkleWitness;
}

export interface UpdateDocumentResponse {
  witness: MerkleWitness;
}

export interface DropDocumentResponse {
  witness: MerkleWitness;
}

export const DOCUMENT_FIND_QUERY = `
  query DocumentFind(
    $databaseName: String!, 
    $collectionName: String!, 
    $documentQuery: JSON!) 
    {
      documentFind(
        databaseName: $databaseName, 
        collectionName: $collectionName, 
        documentQuery: $documentQuery
      ) {
          _id
          document {
            name
            kind
            value
          }
        }
    }
`;

export const DOCUMENT_CREATE_MUTATION = `
  mutation DocumentCreate(
    $databaseName: String!,
    $collectionName: String!,
    $documentRecord: [DocumentRecordInput!]!,
    $documentPermission: PermissionDetailInput
  ) {
    documentCreate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      documentRecord: $documentRecord,
      documentPermission: $documentPermission
    ) {
      isLeft
      sibling
    }
  }
`;

export const DOCUMENT_UPDATE_MUTATION = `
  mutation DocumentUpdate(
    $databaseName: String!,
    $collectionName: String!,
    $documentQuery: JSON!,
    $documentRecord: [DocumentRecordInput!]!
  ) {
    documentUpdate(
      databaseName: $databaseName,
      collectionName: $collectionName,
      documentQuery: $documentQuery,
      documentRecord: $documentRecord
    ) {
      isLeft
      sibling
    }
  }
`;

export const DOCUMENT_DROP_MUTATION = `
  mutation DocumentDrop(
    $databaseName: String!,
    $collectionName: String!,
    $documentQuery: JSON!
  ) {
    documentDrop(
      databaseName: $databaseName,
      collectionName: $collectionName,
      documentQuery: $documentQuery
    ) {
      isLeft
      sibling
    }
  }
`;

export const readDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: any
): Promise<FindDocumentResponse> => {
  const variables = {
    databaseName,
    collectionName,
    documentQuery,
  };
  try {
    const response = await query<{ documentFind: FindDocumentResponse }>(
      DOCUMENT_FIND_QUERY,
      variables
    );
    const { documentFind } = response;

    return {
      ...documentFind,
    };
  } catch (error) {
    throw new Error('readDocument failed: ' + error);
  }
};

export const createDocument = async (
  databaseName: string,
  collectionName: string,
  documentRecord: DocumentEncoded,
  documentPermission: Permissions
): Promise<CreateDocumentResponse> => {
  const variables = {
    databaseName,
    collectionName,
    documentRecord,
    documentPermission,
  };
  try {
    const response = await mutate<{ documentCreate: CreateDocumentResponse }>(
      DOCUMENT_CREATE_MUTATION,
      variables
    );
    const { documentCreate } = response;

    return {
      witness: documentCreate as any,
    };
  } catch (error) {
    throw new Error('createDocument failed: ' + error);
  }
};

export const updateDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON,
  documentRecord: DocumentEncoded
): Promise<UpdateDocumentResponse> => {
  const variables = {
    databaseName,
    collectionName,
    documentQuery,
    documentRecord,
  };
  try {
    const response = await mutate<{ documentUpdate: UpdateDocumentResponse }>(
      DOCUMENT_UPDATE_MUTATION,
      variables
    );
    const { documentUpdate } = response;

    return {
      witness: documentUpdate as any,
    };
  } catch (error) {
    throw new Error('updateDocument failed: ' + error);
  }
};

export const dropDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON
): Promise<DropDocumentResponse> => {
  const variables = {
    databaseName,
    collectionName,
    documentQuery,
  };
  try {
    const response = await mutate<{ documentDrop: DropDocumentResponse }>(
      DOCUMENT_DROP_MUTATION,
      variables
    );
    const { documentDrop } = response;

    return {
      witness: documentDrop as any,
    };
  } catch (error) {
    throw new Error('dropDocument failed: ' + error);
  }
};
