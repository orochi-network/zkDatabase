import { UInt32, CircuitString } from 'snarkyjs';
import { ZKDatabaseStorage, IKeyValue } from '../core/index.js';
import { Schema } from '../core/schema.js';

const Account = Schema({
  name: CircuitString,
  balance: UInt32,
}).extends({
  index(): IKeyValue {
    return {
      name: (this as any).name.toString(),
    };
  },

  toJSON(): any {
    return {
      name: (this as any).name.toString(),
      balance: (this as any).balance.toString(),
    };
  },
});

(async () => {
  const zkDB = await ZKDatabaseStorage.getInstance(16, false);
  await zkDB.use('test');

  let accountChiro = new Account({
    name: CircuitString.fromString('chiro'),
    balance: UInt32.from(100),
  });

  let accountFlash = new Account({
    name: CircuitString.fromString('flash'),
    balance: UInt32.from(50),
  });

  let emptyAccount = new Account({
    name: CircuitString.fromString(''),
    balance: UInt32.from(0),
  });

  const findChiro = await zkDB.find('name', 'chiro');
  const findFlash = await zkDB.find('name', 'flash');

  if (findChiro.length === 0) {
    await zkDB.write(accountChiro);
  } else {
    const updatedChiro = emptyAccount.deserialize(
      findChiro[0].data || new Uint8Array(0)
    );

    await zkDB.update(
      findChiro[0].index,
      new Account({
        name: updatedChiro.name,
        balance: updatedChiro.balance.add(1),
      })
    );
  }

  if (findFlash.length === 0) {
    await zkDB.write(accountFlash);
  } else {
    const updatedFlash = emptyAccount.deserialize(
      findFlash[0].data || new Uint8Array(0)
    );
    await zkDB.update(
      findFlash[0].index,
      new Account({
        name: updatedFlash.name,
        balance: updatedFlash.balance.add(1),
      })
    );
  }

  const index0 = emptyAccount.deserialize(
    (await zkDB.read(0)) || new Uint8Array()
  );
  console.log('Index 0:', index0.toJSON());

  const index1 = emptyAccount.deserialize(
    (await zkDB.read(1)) || new Uint8Array()
  );
  accountFlash = index1;
  console.log('Index 1:', index1.toJSON());

  // We retry to update the record
  {
    const findChiro = await zkDB.find('name', 'chiro');
    const findFlash = await zkDB.find('name', 'flash');

    if (findChiro.length === 0) {
      await zkDB.write(accountChiro);
    } else {
      const updatedChiro = emptyAccount.deserialize(
        findChiro[0].data || new Uint8Array(0)
      );

      await zkDB.update(
        findChiro[0].index,
        new Account({
          name: updatedChiro.name,
          balance: updatedChiro.balance.add(1),
        })
      );
    }

    if (findFlash.length === 0) {
      await zkDB.write(accountFlash);
    } else {
      const updatedFlash = emptyAccount.deserialize(
        findFlash[0].data || new Uint8Array(0)
      );
      await zkDB.update(
        findFlash[0].index,
        new Account({
          name: updatedFlash.name,
          balance: updatedFlash.balance.add(1),
        })
      );
    }

    const index0 = emptyAccount.deserialize(
      (await zkDB.read(0)) || new Uint8Array()
    );
    console.log('Index 0:', index0.toJSON());

    const index1 = emptyAccount.deserialize(
      (await zkDB.read(1)) || new Uint8Array()
    );
    accountFlash = index1;
    console.log('Index 1:', index1.toJSON());
  }
})();
