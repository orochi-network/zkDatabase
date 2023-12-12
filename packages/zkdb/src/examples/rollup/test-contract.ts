import { UInt64, method } from "o1js";
import { User } from "./user.js";
import { ZKDatabase } from "../../core/zk-database.js";
import { initializeZKDatabase, zkDbPublicKey, zkdb } from "./data.js";

await initializeZKDatabase(12)

export class TestContract extends ZKDatabase.SmartContract(User, zkdb, zkDbPublicKey) {
  @method saveUser(index: UInt64, user: User) {
    this.insert(index, this.createDocument(user));
  }
}
