import { Mina, PrivateKey, AccountUpdate, Provable, Field, UInt64 } from 'o1js';
import { User } from './user.js';
import { TestContract } from './test-contract.js';
import { zkDbPrivateKey, zkdb } from './data.js';

let doProofs = false;

(async () => {
  let Local = Mina.LocalBlockchain({ proofsEnabled: doProofs });
  Mina.setActiveInstance(Local);

  let feePayerKey = Local.testAccounts[0].privateKey;
  let feePayer = Local.testAccounts[0].publicKey;

  // the zkapp account
  let zkappKey = PrivateKey.random();
  let zkappAddress = zkappKey.toPublicKey();

  const test = new TestContract(zkappAddress);

  let tx = await test.deployZkDatabaseContract(feePayer);

  await tx.prove();
  await tx.sign([feePayerKey, zkDbPrivateKey]).send();

  tx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer);
    test.deploy();
  });

  await tx.prove();
  await tx.sign([feePayerKey, zkappKey]).send();

  for (let i = 0; i < 5; i++) {
    const newUser = new User({
      accountName: Field(i),
      ticketAmount: Field(i),
    });

    const index = await zkdb.add(newUser);

    tx = await Mina.transaction(feePayer, () => {
      test.saveUser(UInt64.from(index), newUser);
    });

    await tx.prove();
    await tx.sign([feePayerKey, zkappKey]).send();
  }

  const tx1 = await test.rollUp(feePayer, 3);

  if (tx1) {
    await tx1.sign([zkappKey, feePayerKey]).send();
  }

  Provable.log('action state after new user', test.getActionState());
})();
