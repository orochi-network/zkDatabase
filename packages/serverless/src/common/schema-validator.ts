import { ParameterList } from '../model/abstract/document';
import { ModelSchema, SchemaBuilder } from '../model/database/schema';
import { O1DataType } from './o1js';
import { PermissionBasic } from './permission';

export default class SchemaValidator {
  private modelSchema: ModelSchema;

  constructor(modelSchema: ModelSchema) {
    this.modelSchema = modelSchema;
  }

  public async createSchema(
    collection: string,
    parameters: ParameterList,
    permission: PermissionBasic
  ) {
    const schemas: SchemaBuilder[] = parameters.data.map((param, index) => {
      const [name, type, _] = param;
      return {
        order: index,
        name,
        type: type as O1DataType,
        indexed: false,
      };
    });

    await this.modelSchema.createSchema(collection, {
      schemas,
      permission,
    });
  }

  public async validate(
    collection: string,
    parameters: ParameterList
  ): Promise<boolean> {
    const schemaDefBuilder = await this.modelSchema.getSchema(collection);

    // Convert the SchemaDefBuilder to a map for easier lookup
    const schemaMap = new Map<string, O1DataType>();

    (schemaDefBuilder.schemas as any).forEach((schema: SchemaBuilder) => {
      schemaMap.set(schema.name, schema.type);
    });
    // Validate each parameter in the ParameterList
    const isValid = parameters.data.every(([name, type, _]) => {
      const expectedType = schemaMap.get(name);
      return expectedType && expectedType === type;
    });

    return isValid; // All parameters are valid
  }
}
