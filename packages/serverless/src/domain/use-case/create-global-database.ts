import { DatabaseEngine } from 'storage';
import { UseCase } from './use-case';
import ModelDocumentMetadata from '../../model/database/document-metadata';
import ModelGroup from '../../model/database/group';
import { ModelSchema } from '../../model/database/schema';
import { ModelDbSetting } from '../../model/database/setting';
import ModelUserGroup from '../../model/database/user-group';

export type CreateGlobalDatabaseInput = {
  databaseName: string;
  merkleHeight: number;
};

export class CreateGlobalDatabaseUseCase
  implements UseCase<CreateGlobalDatabaseInput, boolean>
{
  // eslint-disable-next-line no-unused-vars
  async execute(input: CreateGlobalDatabaseInput): Promise<boolean> {
    if (await DatabaseEngine.getInstance().isDatabase(input.databaseName)) {
      throw new Error('Database already exist');
    }
    await ModelDocumentMetadata.init(input.databaseName);
    await ModelSchema.init(input.databaseName);
    await ModelGroup.init(input.databaseName);
    await ModelUserGroup.init(input.databaseName);
    await ModelDbSetting.getInstance(input.databaseName).updateSetting({
      merkleHeight: input.merkleHeight,
    });
    return true;
  }
}
