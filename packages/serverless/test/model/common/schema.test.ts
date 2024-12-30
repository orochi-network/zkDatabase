/** This test ensures Schema class is compatible with zk app and has consistent
 * serialization and deserialization methods.
 * NOTE: if you can't run this test, try removing the exclusion rule for this
 * file in this package's tsconfig.json */

/* eslint-disable max-classes-per-file */
import {
  AccountUpdate,
  Mina,
  Poseidon,
  PrivateKey,
  SmartContract,
  State,
  UInt32,
  method,
  Field,
  state,
  Int64,
  UInt64,
  Bool,
  PublicKey,
  Signature,
  Character,
  Sign,
} from 'o1js';
import { Schema } from '@zkdb/common';

class User extends Schema.create({
  name: Field,
  age: UInt32,
  // circuitString: CircuitString, // TODO: not sure how this works, need to investigate
  i64: Int64,
  u64: UInt64,
  bool: Bool,
  privateKey: PrivateKey,
  publicKey: PublicKey,
  signature: Signature,
  character: Character,
  sign: Sign,
  field: Field,
  // merkleMapWitness: MerkleMapWitness, // not implemented
}) {}

class TestSmartContract extends SmartContract {
  @state(Field) user = State<Field>();

  @method async saveUser(user: User) {
    this.user.getAndRequireEquals();
    this.user.set(user.hash());
  }
}
describe('Schema', () => {
  const privateKey = PrivateKey.random();
  const publicKey = privateKey.toPublicKey();
  const signature = Signature.create(privateKey, [Field(0), Field(1)]);
  const name = Field(0);
  const age = UInt32.from(4);
  const i64 = Int64.create(new UInt64(0)).add(2);
  const u64 = new UInt64(3);
  const bool = new Bool(false);
  const character = new Character(10);
  const sign = Sign.minusOne;
  const field = new Field(5);

  const EXPECTED_HASH = Poseidon.hash(
    name
      .toFields()
      .concat(age.toFields())
      .concat(i64.toFields())
      .concat(u64.toFields())
      .concat(bool.toFields())
      .concat(privateKey.toFields())
      .concat(publicKey.toFields())
      .concat(signature.toFields())
      .concat(character.toField())
      .concat(sign.toFields())
      .concat(field.toFields())
  );

  it('Should hash schema', () => {
    // Set up
    const myUser = new User({
      name,
      age,
      i64,
      u64,
      bool,
      privateKey,
      publicKey,
      signature,
      character,
      sign,
      field,
    });

    // Execute
    const userHash = myUser.hash();

    // Verify
    expect(userHash).toEqual(EXPECTED_HASH);
  });

  it('Should hash schema after deserialization', () => {
    // Set up
    const myUser = new User({
      name,
      age,
      i64,
      u64,
      bool,
      privateKey,
      publicKey,
      signature,
      character,
      sign,
      field,
    });

    // Execute
    const serializedUser = myUser.serialize();
    const deserializedUser = User.deserialize(serializedUser);
    const userHash = deserializedUser.hash();

    // Verify
    expect(userHash).toEqual(EXPECTED_HASH);
  });

  it('Should construct schema from schema definition', () => {
    // Set up
    const userSchemaStructure = User.getSchemaDefinition();

    const myUser = new User({
      name,
      age,
      i64,
      u64,
      bool,
      privateKey,
      publicKey,
      signature,
      character,
      sign,
      field,
    });

    const serializedUser = myUser.serialize();

    // Execute
    const UserSchema = Schema.fromSchema(userSchemaStructure);

    const deserializedUser = UserSchema.deserialize(serializedUser);

    const userHash = deserializedUser.hash();

    // Verify
    expect(userHash).toEqual(EXPECTED_HASH);
  });

  it('Schema should be compatible with zk app', async () => {
    // Set up
    const useProof = false;

    const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });
    Mina.setActiveInstance(Local);
    const { key: deployerKey } = Local.testAccounts[0];

    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();

    const zkAppInstance = new TestSmartContract(zkAppAddress);

    const deployTxn = await Mina.transaction(
      {
        sender: deployerKey.toPublicKey(),
      },
      async () => {
        AccountUpdate.fundNewAccount(deployerKey.toPublicKey());
        await zkAppInstance.deploy();
      }
    );
    await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

    const myUser = new User({
      name,
      age,
      i64,
      u64,
      bool,
      privateKey,
      publicKey,
      signature,
      character,
      sign,
      field,
    });

    // Execute
    const tx = await Mina.transaction(
      {
        sender: deployerKey.toPublicKey(),
      },
      async () => {
        zkAppInstance.saveUser(myUser);
      }
    );

    await tx.prove();
    await tx.sign([deployerKey, zkAppPrivateKey]).send();

    // Verify
    expect(zkAppInstance.user.get()).toEqual(EXPECTED_HASH);
  });
});
