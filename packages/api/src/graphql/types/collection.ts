import { TOwnershipAndPermission } from "./ownership";
import { TSchema } from "./schema";

export type TCollection = {
  name: string;
  index: string[];
  schema: TSchema;
  ownership: TOwnershipAndPermission;
};
