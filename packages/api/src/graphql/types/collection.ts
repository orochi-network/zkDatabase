import { TOwnership } from "./ownership"
import { TSchema } from "./schema"

export type Collection = {
  name: string,
  indexes: string[],
  schema: TSchema,
  ownership: TOwnership
}