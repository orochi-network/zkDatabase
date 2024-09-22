import { getDocumentHistory as getDocumentHistoryRequest } from '@zkdb/api';
import { DocumentHistory } from '../types/document-history.js';
import { ProvableTypeString } from '../sdk/schema.js';

export async function getDocumentHistory(
  databaseName: string,
  collectionName: string,
  id: string
): Promise<DocumentHistory> {
  const result = await getDocumentHistoryRequest({
    databaseName,
    collectionName,
    docId: id,
  });

  const documents = result.unwrap().documents;

  return {
    documents: documents.map((document) => ({
      id: document.docId,
      documentEncoded: document.fields.map((field) => ({
        name: field.name,
        kind: field.kind as ProvableTypeString,
        value: field.value,
      })),
      createdAt: document.createdAt,
    })),
  };
}
