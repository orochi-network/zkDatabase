import { DatabaseEngine, ModelDbSetting } from '@zkdb/storage';
import ModelDocumentMetadata from '../../model/database/document-metadata.js';
import ModelGroup from '../../model/database/group.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import ModelUserGroup from '../../model/database/user-group.js';

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  appPublicKey: string
) {
  if (await DatabaseEngine.getInstance().isDatabase(databaseName)) {
    // Ensure database existing
    return true;
  }
  await ModelDocumentMetadata.init(databaseName);
  await ModelCollectionMetadata.init(databaseName);
  await ModelGroup.init(databaseName);
  await ModelUserGroup.init(databaseName);
  await ModelDbSetting.getInstance(databaseName).updateSetting({
    merkleHeight,
    appPublicKey,
  });
  return true;
}
