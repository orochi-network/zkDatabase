import { CollectionMetadata } from './metadata';
import { DocumentSchema } from './schema';

export type Collection = {
  name: string;
  indexes: string[];
  schema: DocumentSchema;
  ownership: CollectionMetadata;
};
