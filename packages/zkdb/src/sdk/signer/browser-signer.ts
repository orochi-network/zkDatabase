import { MinaTransaction } from "../types/o1js.js";
import { AuroWallet } from "../wallet/auro-wallet.js";
import { Signer } from "./interface/signer.js";

export class ExternalSigner implements Signer {

  async signTransaction(transaction: MinaTransaction): Promise<MinaTransaction> {
    return AuroWallet.signTransaction(transaction);
  }
}

