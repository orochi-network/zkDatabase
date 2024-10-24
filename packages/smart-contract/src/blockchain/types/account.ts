import { VerificationKey } from "./verification-key"

export type Account = {
  publicKey: string
  verificationKey: VerificationKey
}