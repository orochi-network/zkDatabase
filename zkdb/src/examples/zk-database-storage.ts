import { Struct, UInt32, Poseidon, Field } from 'snarkyjs';
import { ZKDatabaseStorage, IKeyValue, Binary } from '../core/index.js';

class Account extends Struct({
  name: String,
  balance: UInt32,
}) {
  index(): IKeyValue {
    return {
      name: this.name,
    };
  }

  serialize(): Uint8Array {
    return Binary.fieldToBinary(Account.toFields(this));
  }

  hash(): Field {
    return Poseidon.hash(Account.toFields(this));
  }

  tranfser(from: Account, to: Account, value: number) {
    return {
      from: new Account({
        name: from.name,
        balance: from.balance.sub(value),
      }),
      to: new Account({
        name: to.name,
        balance: to.balance.add(value),
      }),
    };
  }
}

(async () => {
  const zkDB = await ZKDatabaseStorage.getInstance(16);
  await zkDB.use('test');
  const Account1 = new Account({ name: 'chiro', balance: UInt32.from(100) });
  const Account2 = new Account({ name: 'flash', balance: UInt32.from(50) });
  await zkDB.write(Account1);
  await zkDB.write(Account2);
  const account1 = await zkDB.read(0);
  console.log(account1);
})();
