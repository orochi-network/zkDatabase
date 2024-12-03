import { TSchemaField } from '@zkdb/common';
import { ClientSession } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import {
  IMetadataCollection,
  ModelMetadataCollection,
} from '../../model/database/metadata-collection.js';

export async function createCollectionMetadata(
  databaseName: string,
  collectionName: string,
  schema: TSchemaField[],
  permission: number,
  owner: string,
  group: string,
  session?: ClientSession
) {
  const schemaMetadata: IMetadataCollection = {
    owner,
    group,
    collection: collectionName,
    permission,
    field: [],
    createdAt: getCurrentTime(),
    updatedAt: getCurrentTime(),
    definition: [],
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

  await ModelMetadataCollection.getInstance(databaseName).insertOne(
    schemaMetadata,
    {
      session,
    }
  );
}
