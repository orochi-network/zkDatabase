import { zkDatabaseConstant } from '@common';

export class ZkDbMongoIndex {
  private static readonly systemIndexName = zkDatabaseConstant.systemIndex;

  private static isValidFieldName(...fieldList: string[]): boolean {
    for (let i = 0; i < fieldList.length; i += 1) {
      if (!fieldList[i]) {
        throw new Error('Field name cannot be empty.');
      }
      if (fieldList[i].startsWith('$')) {
        throw new Error(`Field name '${fieldList[i]}' cannot start with '$'.`);
      }
      if (fieldList[i].includes('\0')) {
        throw new Error(
          `Field name '${fieldList[i]}' cannot contain null characters.`
        );
      }
    }
    return true;
  }
  public static create(...fieldList: string[]) {
    if (ZkDbMongoIndex.isValidFieldName(...fieldList)) {
      return `${ZkDbMongoIndex.systemIndexName}_${fieldList.join('_')}`;
    }

    throw new Error('Cannot create zkDatabase index');
  }
}
