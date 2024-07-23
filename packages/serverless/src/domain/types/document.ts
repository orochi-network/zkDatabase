import { ProvableTypeString } from '../common/schema.js';

export type Document = Array<{
  name: string;
  kind: ProvableTypeString;
  value: string;
}>;
