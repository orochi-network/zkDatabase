import { DatabaseEngine } from '@database';

export class ModelRegistry {
  private static dbMap = new Map<string, DatabaseEngine>();
  private static instanceMap = new Map<string, any>();

  // Register a database configuration
  public static registerDatabaseConfig(
    ...args: { key: string; db: DatabaseEngine }[]
  ) {
    for (const { key, db } of args) {
      ModelRegistry.dbMap.set(key, db);
    }
  }

  // Initialize and register a model
  public static registerModel(
    modelKey: string,
    modelFactory: (config: DatabaseEngine) => any
  ) {
    const config = ModelRegistry.dbMap.get(modelKey);
    if (!config) {
      throw new Error(`Configuration for "${modelKey}" is not registered.`);
    }
    if (!ModelRegistry.instanceMap.has(modelKey)) {
      ModelRegistry.instanceMap.set(modelKey, modelFactory(config));
    }
  }

  // Get a model instance by key
  public static getModel<T>(modelKey: string): T {
    const instance = ModelRegistry.instanceMap.get(modelKey);
    if (!instance) {
      throw new Error(`Model "${modelKey}" is not registered.`);
    }
    return instance as T;
  }
}
