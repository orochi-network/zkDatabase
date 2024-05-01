import { ProvableTypeString } from "../common/schema";

export type Document = Array<{
  name: string;
  kind: ProvableTypeString;
  value: string;
}>;
