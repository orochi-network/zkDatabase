import { CollectionMetadata } from "./metadata.js";
import { DocumentSchema } from "./schema.js";

export type Collection = {
  name: string,
  indexes: string[],
  schema: DocumentSchema,
  ownership: CollectionMetadata
  sizeOnDisk: number
}