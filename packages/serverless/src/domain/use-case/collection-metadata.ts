import { TSchemaFieldDefinition } from '@zkdb/common';
import { ClientSession } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';

export async function createCollectionMetadata(
  databaseName: string,
  collectionName: string,
  schema: TSchemaFieldDefinition[],
  permission: number,
  owner: string,
  group: string,
  session?: ClientSession
) {
  const schemaMetadata = {
    owner,
    group,
    permission,
    createdAt: getCurrentTime(),
    updatedAt: getCurrentTime(),
    collectionName,
    schema,
  };

  await ModelMetadataCollection.getInstance(databaseName).insertOne(
    schemaMetadata,
    {
      session,
    }
  );
}
