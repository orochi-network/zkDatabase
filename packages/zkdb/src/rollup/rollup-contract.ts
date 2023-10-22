/* eslint-disable no-unused-vars */
import { Field } from "o1js"
import { Action } from "./action.js"
import { RollUpProof } from "./offchain-rollup.js"

export interface IRollupContract {
  getState(): Field
  getActionState(): Field,
  getUnprocessedActions(size: number): Promise<Action[]>
  rollUp(rollupProof: RollUpProof): Promise<void>
}