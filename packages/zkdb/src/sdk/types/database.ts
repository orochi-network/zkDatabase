export type DatabaseInfo = {
  publicKey: string
  merkleHeight: number
}

export type DatabaseCreationStatus = "compiling" | "proving" | "tr"