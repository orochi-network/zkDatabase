import { Field, Struct, UInt64 } from "o1js";

export enum OperationType {
  // eslint-disable-next-line no-unused-vars
  INSERT = 0,
  // eslint-disable-next-line no-unused-vars
  REMOVE = 1
}

export function getOperationIndexByType(type: OperationType): Field {
  return Field(type);
}

export class Action extends Struct({
  type: Field,
  index: UInt64,
  hash: Field
}) {
}