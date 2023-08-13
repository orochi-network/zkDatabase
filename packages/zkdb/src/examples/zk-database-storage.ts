import { UInt32, CircuitString } from 'snarkyjs';
import { Schema, ZKDatabaseStorage } from '../core/index.js';

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
  const zkDB = await ZKDatabaseStorage.getInstance(16, './data', false);
  await zkDB.use('test');

  console.log('Loaded Merkle root:', (await zkDB.getMerkleRoot()).toString());

  let findChiro = await zkDB.findOne('accountName', 'chiro');
  let findFlash = await zkDB.findOne('accountName', 'flash');

  if (findChiro.isEmpty()) {
    await zkDB.add(
      new Account({
        accountName: CircuitString.fromString('chiro'),
        balance: UInt32.from(100),
      })
    );
  } else {
    const chiro = await findChiro.load(Account);
    await findChiro.update(
      new Account({
        accountName: chiro.accountName,
        balance: chiro.balance.add(1),
      })
    );
  }

  if (findFlash.isEmpty()) {
    await zkDB.add(
      new Account({
        accountName: CircuitString.fromString('flash'),
        balance: UInt32.from(50),
      })
    );
  } else {
    const flash = await findFlash.load(Account);
    await findFlash.update(
      new Account({
        accountName: flash.accountName,
        balance: flash.balance.add(1),
      })
    );
  }
  findChiro = await zkDB.findOne('accountName', 'chiro');
  findFlash = await zkDB.findOne('accountName', 'flash');
  const index0 = await findChiro.load(Account);
  const index1 = await findFlash.load(Account);
  console.table([index0.json(), index1.json()]);

  console.log('New Merkle root:', (await zkDB.getMerkleRoot()).toString());
})();
