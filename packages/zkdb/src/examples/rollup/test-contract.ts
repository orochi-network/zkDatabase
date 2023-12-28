import {
  CircuitString,
  UInt32,
  UInt64,
  method,
} from 'o1js';
import { ZKDatabase } from '../../core/zk-database.js';
import { initializeZKDatabase, zkDbPublicKey, zkdb } from './data.js';
import { Schema } from '../../core/schema.js';

await initializeZKDatabase(12);
export class Account extends Schema.create({
  age: UInt32,
  name: CircuitString
}) {}

export class TestContract extends ZKDatabase.SmartContract(
  Account,
  zkdb,
  zkDbPublicKey
) {
  @method saveUser(index: UInt64, user: Account) {
    this.insert(index, user)
  }
}
