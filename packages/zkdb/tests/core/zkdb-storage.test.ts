import { Field, PrivateKey, Provable, UInt32 } from 'o1js';
import { Schema } from '../../src/core/schema.js';
import { ZKDatabaseStorage } from '../../src/core/zkdb-storage.js';

const DATABASE_HEIGHT = 12;

describe('ZKDatabaseStorage', () => {
  describe('Read Document', () => {
    test('should read and return document for the server', async () => {
      const userInfo = { email: 'user@example.com', userName: 'user' };
      const keypair = {
        privateKey: 'EKFKAwugYRcoXXzj5L5PYoYcnNnMSLbG3zzgcpDXgsUu2Xy3hPwz',
        publicKey: 'B62qphs6sD7vsL1H3wYDKiUpvL3vZNkFYkncMCyRoy7zXFP972h9ASQ',
      };

      class User extends Schema.create({
        name: Field,
        age: UInt32,
      }) {}

      const newUser = new User({
        name: Field(23),
        age: UInt32.from(23),
      });

      const zkdb = new ZKDatabaseStorage();

      const isSignedUp = await zkdb.signUp(
        userInfo,
        PrivateKey.fromBase58(keypair.privateKey)
      );

      if (isSignedUp) {
        await zkdb.signIn(
          userInfo.email,
          PrivateKey.fromBase58(keypair.privateKey)
        );
      }

      const testDb = await zkdb.database('test-db').create(DATABASE_HEIGHT);
      const userCollection = await testDb
        .collection('users')
        .create(User, 'users', 'group for storing users', {
          permissionOwner: {
            create: true,
            read: true,
            system: true,
            delete: true,
            write: true,
          },
        });

      let findUser = await userCollection.document().get({ id: 1 }, User);

      Provable.log('findUser', findUser);

      const witness = await userCollection.document().new(newUser, {
        permissionOwner: {
          read: true,
          write: true,
          system: true
        },
      });

      console.log('witness', witness);

      const document = userCollection.document();
      findUser = await document.get({ age: 23 }, User);

      Provable.log('findUser 23', findUser);

      const newUser1 = new User({
        name: Field(23),
        age: UInt32.from(25),
      });

      await document.update(newUser1, { age: 23 });

      findUser = await document.get({ age: 25 }, User);
      Provable.log('findUser 25', findUser);

      let permissions = await document.getPermissions();

      console.log('prev permissions', permissions);

      await document.changePermission('Other', {
        read: true,
        write: true,
        create: true,
        system: false,
        delete: true,
      });

      await document.changePermission('Group', {
        read: false,
        write: false,
        create: true,
        system: false,
        delete: false,
      });

      permissions = await document.getPermissions();

      console.log('prev permissions', permissions);

      await zkdb.logOut();
    });
  });

  describe('Update Document', () => {
    test('should update and return document for the server', async () => {
      const userInfo = { email: 'user@example.com', userName: 'user' };
      const keypair = {
        privateKey: 'EKFKAwugYRcoXXzj5L5PYoYcnNnMSLbG3zzgcpDXgsUu2Xy3hPwz',
        publicKey: 'B62qphs6sD7vsL1H3wYDKiUpvL3vZNkFYkncMCyRoy7zXFP972h9ASQ',
      };

      class User extends Schema.create({
        name: Field,
        age: UInt32,
      }) {}

      const zkdb = new ZKDatabaseStorage();

      await zkdb.signIn(
        userInfo.email,
        PrivateKey.fromBase58(keypair.privateKey)
      );

      const userCollection = await zkdb.database('test-db').collection('users');

      const document = userCollection.document();

      const findUser = await document.get({ age: 25 }, User);
      Provable.log('findUser 25', findUser);

      let permissions = await document.getPermissions();

      console.log('prev permissions', permissions);

      await document.changePermission('Other', {
        read: true,
        write: true,
        create: true,
        system: false,
        delete: true,
      });

      await document.changePermission('Group', {
        read: false,
        write: false,
        create: true,
        system: false,
        delete: false,
      });

      permissions = await document.getPermissions();

      console.log('prev permissions', permissions);

      await zkdb.logOut();
    });
  });
});
