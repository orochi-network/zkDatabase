import { PrivateKey } from "o1js";
import { Signer } from "./interface/signer.js";
import { MinaTransaction } from "../types/o1js.js";

export class NodeSigner implements Signer {
  private privateKey: PrivateKey;

  constructor(privateKey: PrivateKey) {
    this.privateKey = privateKey;
  }

  async signTransaction(transaction: MinaTransaction): Promise<MinaTransaction> {
    transaction.sign([this.privateKey]);
    return transaction;
  }
}