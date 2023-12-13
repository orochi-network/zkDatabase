import { ZKDatabaseStorage } from "../../core/zkdb-storage.js";
import { PrivateKey } from "o1js";

let zkDbPrivateKey = PrivateKey.random();
let zkDbPublicKey = zkDbPrivateKey.toPublicKey();
export let zkdb: ZKDatabaseStorage

export async function initializeZKDatabase(merkleHeight: number) {
  zkdb = await ZKDatabaseStorage.getInstance('zkdb-test', {
    storageEngine: 'local',
    merkleHeight,
    storageEngineCfg: {
      location: './data',
    },
  });
}
export {
  zkDbPrivateKey,
  zkDbPublicKey
}