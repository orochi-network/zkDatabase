/* eslint-disable no-unused-vars */
import { MinaTransaction } from "../../types/o1js.js";

export interface Signer {
  signTransaction(transaction: MinaTransaction): Promise<MinaTransaction>;
}


