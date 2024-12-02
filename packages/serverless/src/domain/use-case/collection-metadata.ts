import { ClientSession } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import { TDocumentSchemaInput, TDocumentMetadata } from '../../types/index.js';

export async function createCollectionMetadata(
  databaseName: string,
  collectionName: string,
  schema: TDocumentSchemaInput,
  permission: number,
  owner: string,
  group: string,
  session?: ClientSession
) {
  const schemaMetadata: TDocumentMetadata = {
    owner,
    group,
    collection: collectionName,
    permission,
    field: [],
    createdAt: getCurrentTime(),
    updatedAt: getCurrentTime(),
  };

  for (let i = 0; i < schema.length; i += 1) {
    const { name, kind } = schema[i];
    schemaMetadata.field.push(name);
    schemaMetadata[name] = {
      order: i,
      name,
      kind,
    };
  }

  await ModelCollectionMetadata.getInstance(databaseName).insertOne(
    schemaMetadata,
    {
      session,
    }
  );
}
