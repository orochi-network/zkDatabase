import { Field, Struct, UInt64 } from "o1js";

export enum OperationType {
  INSERT,
  REMOVE
}

export function getOperationIndexByType(type: OperationType): Field {
  if (type === OperationType.INSERT) {
    return Field(0);
  } else {
    return Field(1);
  }
}

export class Action extends Struct({
  type: Field,
  index: UInt64,
  hash: Field
}) {
}