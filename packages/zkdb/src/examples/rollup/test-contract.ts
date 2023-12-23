import { CircuitString, SmartContract, UInt32, UInt64, method } from 'o1js';
import { ZKDatabase } from '../../core/zk-database.js';
import { initializeZKDatabase, zkDbPublicKey, zkdb } from './data.js';
import { Schema } from '../../core/schema.js';

await initializeZKDatabase(12);

export class User extends Schema.create({
  age: UInt32,
  name: CircuitString,
}) {}

export class TestContract extends SmartContract {
  @method saveUser(index: UInt64, user: User) {
    user.age.assertEquals(UInt32.from(0));
  }
}
