import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TRollupStateRecordNullable } from '@zkdb/common';
import { OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelMetadataDatabase } from '../global';

/*
    This class created to manage rollup state each database
    The old way will store these thing to latest rollup history
    But it quite wrong since it that rollup history transaction already `confirmed` 
    And we still modify that, it lead to misunderstanding and conflict state in the feature
    Separate Rollup state will help us manage and easy to perform the state and easy to maintain
*/
export class ModelRollupState extends ModelGeneral<
  OptionalId<TRollupStateRecordNullable>
> {
  private static instances = new Map<string, ModelRollupState>();

  private constructor(databaseName: string) {
    super(
      databaseName,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.databaseCollection.rollUpState
    );
  }

  public static async getInstance(
    databaseName: string
  ): Promise<ModelRollupState> {
    if (!ModelRollupState.instances.has(databaseName)) {
      const imMetadataDatabase = ModelMetadataDatabase.getInstance();
      const metadataDatabase = await imMetadataDatabase.findOne({
        databaseName,
      });
      if (!metadataDatabase) {
        throw new Error(`Metadata of ${databaseName} has not been found.`);
      }
      ModelRollupState.instances.set(
        databaseName,
        new ModelRollupState(databaseName)
      );
    }
    return ModelRollupState.instances.get(databaseName)!;
  }
}
