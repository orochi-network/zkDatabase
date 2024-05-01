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
} from 'o1js';
import { Schema } from '../../../src/domain/common/schema';

class User extends Schema.create({
  name: Field,
  age: UInt32,
}) {}

class TestSmartContract extends SmartContract {
  @state(Field) user = State<Field>();

  @method saveUser(user: User) {
    this.user.getAndRequireEquals();
    this.user.set(user.hash());
  }
}
describe('Schema', () => {
  it('Should hash schema', () => {
    // Set up
    const myUser = new User({
      name: Field(0),
      age: UInt32.from(4),
    });

    const EXPECTED_HASH = Poseidon.hash(
      Field(0).toFields().concat(UInt32.from(4).toFields())
    );

    // Execute
    const userHash = myUser.hash();

    // Verify
    expect(userHash).toEqual(EXPECTED_HASH);
  });

  it('Should hash schema after deserialization', () => {
    // Set up
    const myUser = new User({
      name: Field(0),
      age: UInt32.from(4),
    });

    const EXPECTED_HASH = Poseidon.hash(
      Field(0).toFields().concat(UInt32.from(4).toFields())
    );

    // Execute
    const serializedUser = myUser.serialize();
    const deserializedUser = User.deserialize(serializedUser);
    const userHash = deserializedUser.hash();

    // Verify
    expect(userHash).toEqual(EXPECTED_HASH);
  });

  it('Should construct schema from schema definition', () => {
    // Set up
    const userSchemaStructure = User.getSchema();

    const myUser = new User({
      name: Field(0),
      age: UInt32.from(4),
    });

    const serializedUser = myUser.serialize();

    const EXPECTED_HASH = Poseidon.hash(
      Field(0).toFields().concat(UInt32.from(4).toFields())
    );

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

    const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
    Mina.setActiveInstance(Local);
    const { privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0];
    const { privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1];

    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();

    const zkAppInstance = new TestSmartContract(zkAppAddress);
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkAppInstance.deploy();
    });
    await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

    const myUser = new User({
      name: Field(0),
      age: UInt32.from(4),
    });

    const EXPECTED_HASH = Poseidon.hash(
      Field(0).toFields().concat(UInt32.from(4).toFields())
    );

    // Execute
    const tx = await Mina.transaction(senderAccount, () => {
      zkAppInstance.saveUser(myUser);
    })
    
    await tx.prove();
    await tx.sign([senderKey, zkAppPrivateKey]).send();

    // Verify
    expect(zkAppInstance.user.get()).toEqual(EXPECTED_HASH);
  });
});
