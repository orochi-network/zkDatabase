import { DatabaseEngine, ModelDbSetting } from '@zkdb/storage';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import ModelGroup from '../../model/database/group';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata';
import ModelUserGroup from '../../model/database/user-group';

// eslint-disable-next-line import/prefer-default-export
export async function createDatabase(
  databaseName: string,
  merkleHeight: number
) {
  if (await DatabaseEngine.getInstance().isDatabase(databaseName)) {
    throw new Error('Database already exist');
  }
  await ModelDocumentMetadata.init(databaseName);
  await ModelCollectionMetadata.init(databaseName);
  await ModelGroup.init(databaseName);
  await ModelUserGroup.init(databaseName);
  await ModelDbSetting.getInstance(databaseName).updateSetting({
    merkleHeight,
  });
  return true;
}
