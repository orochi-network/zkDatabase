/*
import {
  SmartContract,
  Poseidon,
  Field,
  State,
  state,
  Mina,
  method,
  UInt32,
  PrivateKey,
  AccountUpdate,
  MerkleTree,
  MerkleWitness,
  Struct,
} from 'snarkyjs';
import { IKeyValue } from '../core/common.js';
import { Binary } from 'utilities/binary.js';

const doProofs = true;

class MyMerkleWitness extends MerkleWitness(8) {}

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
// we need the initiate tree root in order to tell the contract about our off-chain storage
let initialCommitment: Field = Field(0);


class Leaderboard extends SmartContract {
  // a commitment is a cryptographic primitive that allows us to commit to data, with the ability to "reveal" it later
  @state(Field) commitment = State<Field>();

  @method init() {
    super.init();
    this.commitment.set(initialCommitment);
  }

  @method
  transfer(
    from: Account,
    fromWitness: MyMerkleWitness,
    to: Account,
    toWitness: MyMerkleWitness,
    value: number
  ) {
    // we fetch the on-chain commitment
    const commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the account is within the committed Merkle Tree
    fromWitness.calculateRoot(from.hash()).assertEquals(commitment);

    fromWitness.calculateRoot(to.hash()).assertEquals(commitment);

    // we update the account and grant one point!
    const updated = from.tranfser(from, to, value);

    // we calculate the new Merkle Root, based on the account changes
    let newCommitment = fromWitness.calculateRoot(updated.from.hash());

    this.commitment.set(newCommitment);
  }
}

(async () => {
  type Names = 'Bob' | 'Alice' | 'Charlie' | 'Olivia';

  let Local = Mina.LocalBlockchain({ proofsEnabled: doProofs });
  Mina.setActiveInstance(Local);
  let initialBalance = 10_000_000_000;

  let feePayerKey = Local.testAccounts[0].privateKey;
  let feePayer = Local.testAccounts[0].publicKey;

  // the zkapp account
  let zkappKey = PrivateKey.random();
  let zkappAddress = zkappKey.toPublicKey();

  // this map serves as our off-chain in-memory storage
  let Accounts: Map<string, Account> = new Map<Names, Account>(
    ['Bob', 'Alice', 'Charlie', 'Olivia'].map((name: string, index: number) => {
      return [
        name as Names,
        new Account({
          publicKey: Local.testAccounts[index].publicKey,
          points: UInt32.from(0),
        }),
      ];
    })
  );
  // we now need "wrap" the Merkle tree around our off-chain storage
  // we initialize a new Merkle Tree with height 8
  const Tree = new MerkleTree(8);

  Tree.setLeaf(0n, Accounts.get('Bob')!.hash());
  Tree.setLeaf(1n, Accounts.get('Alice')!.hash());
  Tree.setLeaf(2n, Accounts.get('Charlie')!.hash());
  Tree.setLeaf(3n, Accounts.get('Olivia')!.hash());

  // now that we got our accounts set up, we need the commitment to deploy our contract!
  initialCommitment = Tree.getRoot();

  let leaderboardZkApp = new Leaderboard(zkappAddress);
  console.log('Deploying leaderboard..');
  if (doProofs) {
    await Leaderboard.compile();
  }
  let tx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer).send({
      to: zkappAddress,
      amount: initialBalance,
    });
    leaderboardZkApp.deploy();
  });
  await tx.prove();
  await tx.sign([feePayerKey, zkappKey]).send();

  console.log('Initial points: ' + Accounts.get('Bob')?.points);

  console.log('Making guess..');
  await makeGuess('Bob', 0n, 22);

  console.log('Final points: ' + Accounts.get('Bob')?.points);

  async function makeGuess(name: Names, index: bigint, guess: number) {
    let account = Accounts.get(name)!;
    let w = Tree.getWitness(index);
    let witness = new MyMerkleWitness(w);

    let tx = await Mina.transaction(feePayer, () => {
      leaderboardZkApp.guessPreimage(Field(guess), account, witness);
    });
    await tx.prove();
    await tx.sign([feePayerKey, zkappKey]).send();

    // if the transaction was successful, we can update our off-chain storage as well
    account.points = account.points.add(1);
    Tree.setLeaf(index, account.hash());
    leaderboardZkApp.commitment.get().assertEquals(Tree.getRoot());
  }
})();
*/
