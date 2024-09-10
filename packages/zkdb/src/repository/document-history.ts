import { getDocumentHistory as getDocumentHistoryRequest } from '@zkdb/api';
import { DocumentHistory } from '../types/document-history.js';
import { ProvableTypeString } from '../sdk/schema.js';

export async function getDocumentHistory(
  databaseName: string,
  collectionName: string,
  id: string
): Promise<DocumentHistory> {
  const result = await getDocumentHistoryRequest(
    databaseName,
    collectionName,
    id
  );

  if (result.type === 'success') {
    return ({
      documents: result.data.documents.map((document) => ({
        id: document.docId,
        documentEncoded: document.fields.map((field) => ({
          name: field.name,
          kind: field.kind as ProvableTypeString,
          value: field.value,
        })),
        createdAt: document.createdAt
      })),
    });
  } else {
    throw Error(result.message)
  }
}
