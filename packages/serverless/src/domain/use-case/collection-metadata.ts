import { ClientSession } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import { DocumentSchemaInput } from '../types/schema.js';

// eslint-disable-next-line import/prefer-default-export
export async function createCollectionMetadata(
  databaseName: string,
  collectionName: string,
  schema: DocumentSchemaInput,
  permission: number,
  owner: string,
  group: string,
  session?: ClientSession
) {
  const schemaDef: any = {
    owner,
    group,
    collection: collectionName,
    permission,
    fields: [],
    createdAt: getCurrentTime(),
    updatedAt: getCurrentTime(),
  };

  for (let i = 0; i < schema.length; i += 1) {
    const { name, kind } = schema[i];
    schemaDef.fields.push(name);
    schemaDef[name] = {
      order: i,
      name,
      kind,
    };
  }

  await ModelCollectionMetadata.getInstance(databaseName).insertOne(schemaDef, {
    session,
  });
}
