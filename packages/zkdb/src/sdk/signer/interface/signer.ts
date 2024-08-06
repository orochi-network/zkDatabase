/* eslint-disable no-unused-vars */
import { PrivateKey } from "o1js";
import { MinaTransaction } from "../../types/o1js.js";

export interface Signer {
  signTransaction(transaction: MinaTransaction, otherKeys: PrivateKey[]): Promise<MinaTransaction>;
}


