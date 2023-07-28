import { UInt32, CircuitString } from 'snarkyjs';
import { ZKDatabaseStorage } from '../core/index.js';
import { Schema } from '../core/schema.js';

class Account extends Schema({
  accountName: CircuitString,
  balance: UInt32,
}) {
  static deserialize(data: Uint8Array): Account {
    return new Account(Account.decode(data));
  }

  index(): { accountName: string } {
    return {
      accountName: this.accountName.toString(),
    };
  }

  json(): { accountName: string; balance: string } {
    return {
      accountName: this.accountName.toString(),
      balance: this.balance.toString(),
    };
  }
}

(async () => {
  const zkDB = await ZKDatabaseStorage.getInstance(16);
  await zkDB.use('test');

  let accountChiro = new Account({
    name: CircuitString.fromString('chiro'),
    balance: UInt32.from(100),
  });

  let accountFlash = new Account({
    name: CircuitString.fromString('flash'),
    balance: UInt32.from(50),
  });

  const findChiro = await zkDB.find('name', 'chiro');
  const findFlash = await zkDB.find('name', 'flash');

  if (findChiro.length === 0) {
    await zkDB.write(accountChiro);
  } else {
    const updatedChiro = Account.deserialize(
      findChiro[0].data || new Uint8Array(0)
    );

    await zkDB.update(
      findChiro[0].index,
      new Account({
        name: updatedChiro.accountName,
        balance: updatedChiro.balance.add(1),
      })
    );
  }

  if (findFlash.length === 0) {
    await zkDB.write(accountFlash);
  } else {
    const updatedFlash = Account.deserialize(
      findFlash[0].data || new Uint8Array(0)
    );
    await zkDB.update(
      findFlash[0].index,
      new Account({
        name: updatedFlash.accountName,
        balance: updatedFlash.balance.add(1),
      })
    );
  }

  const index0 = Account.deserialize((await zkDB.read(0))!);
  console.log('Index 0:', index0.json());

  const index1 = Account.deserialize((await zkDB.read(1))!);
  console.log('Index 1:', index1.json());
})();
