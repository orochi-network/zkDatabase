import { isBrowser } from "../../utils/environment.js";
import { AuroWalletSigner } from "./browser-signer.js";
import { Signer } from "./interface/signer.js";

let signer: Signer;

export function setSigner(newSigner: Signer) {
  if (signer instanceof AuroWalletSigner && !isBrowser()) {
    throw Error('External signer cannot be set in non-browser environment')
  }
  signer = newSigner;
}

export function getSigner(): Signer {
  if (!signer) {
    throw Error('Signer was not set. Call ZKDatabaseClient.setSigner first')
  }
  return signer;
}