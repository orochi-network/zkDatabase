// import { DatabaseEngine } from '@zkdb/storage';
// import { PrivateKey, PublicKey } from 'o1js';
// import { config } from '../../../src/helper/config';
// import { createDatabase } from '../../../src/domain/use-case/database';
// import {
//   changePermissions,
//   hasCollectionPermission
// } from '../../../src/domain/use-case/permission';
// import { createCollectionMetadata } from '../../../src/domain/use-case/collection-metadata';
// import { createCollection } from '../../../src/domain/use-case/collection';
// import { ZKDATABASE_NO_PERMISSION_RECORD } from '../../../src/common/permission';
// import { readMetadata } from '../../../src/domain/use-case/metadata';

// const DB_NAME = 'test-db-schema';
// const TEST_COLLECTION = 'users';
// const MERKLE_HEIGHT = 8;
// const PUBLIC_KEY = PublicKey.fromPrivateKey(PrivateKey.random()).toBase58();

// describe('Permission UseCases', () => {
//   let dbEngine: DatabaseEngine;

//   beforeAll(async () => {
//     dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
//     if (!dbEngine.isConnected()) {
//       await dbEngine.connect();
//     }
//   });

//   afterAll(async () => {
//     await dbEngine.disconnect();
//   });

//   async function dropDatabases() {
//     const adminDb = dbEngine.client.db().admin();

//     // List all databases
//     const { databases } = await adminDb.listDatabases();

//     // Filter out system databases
//     const userDatabases = databases.filter(
//       (dbInfo) => !['admin', 'local', 'config'].includes(dbInfo.name)
//     );

//     // Drop each user database
//     await Promise.all(
//       userDatabases.map(async (dbInfo) => {
//         const db = dbEngine.client.db(dbInfo.name);
//         await db.dropDatabase();
//       })
//     );
//   }

//   beforeEach(async () => {
//     await dropDatabases();
//     await createDatabase(DB_NAME, MERKLE_HEIGHT, "", PUBLIC_KEY);
//   });

//   afterEach(async () => {
//     await dropDatabases();
//   });

//   describe('checkPermission', () => {
//     test('checkPermission should return true for read permission on created schema for owner', async () => {
//       const schema = [
//         { name: 'name', kind: 'Field', indexed: true },
//         { name: 'admin', kind: 'Bool', indexed: false },
//       ];

//       const permissions = {
//         permissionOwner: { read: true, write: true },
//         permissionGroup: { read: false },
//         permissionOther: { read: false },
//       };

//       const schemas = schema.reduce((acc: any, field: any) => {
//         acc[field[0]] = {
//           name: field[0],
//           kind: field[1],
//           value: field[2],
//         };
//         return acc;
//       }, []);

//       await createCollectionMetadata(
//         DB_NAME,
//         TEST_COLLECTION,
//         schemas,
//         permissions,
//         'IAM',
//         'users'
//       );

//       const permitted = await hasCollectionPermission(
//         DB_NAME,
//         TEST_COLLECTION,
//         'IAM',
//         'read'
//       );

//       expect(permitted).toBeTruthy();
//     });
//     test('checkPermission should return false for write permission on created schema for group', async () => {
//       const schema = [
//         { name: 'name', kind: 'Field', indexed: true },
//         { name: 'admin', kind: 'Bool', indexed: false },
//       ];

//       const permissions = {
//         permissionOwner: { read: true, write: false },
//         permissionGroup: { read: true, write: false },
//         permissionOther: { read: false },
//       };

//       const schemas = schema.reduce((acc: any, field: any) => {
//         acc[field[0]] = {
//           name: field[0],
//           kind: field[1],
//           value: field[2],
//         };
//         return acc;
//       }, {});

//       await createCollectionMetadata(
//         DB_NAME,
//         TEST_COLLECTION,
//         schemas,
//         permissions,
//         'IAM',
//         'users'
//       );

//       let permitted = await hasCollectionPermission(
//         DB_NAME,
//         TEST_COLLECTION,
//         'IAM',
//         'read'
//       );
//       expect(permitted).toBeTruthy();

//       permitted = await hasCollectionPermission(
//         DB_NAME,
//         TEST_COLLECTION,
//         'IAM',
//         'write'
//       );
//       expect(permitted).toBeFalsy();
//     });
//   });

//   describe('changePermissions', () => {
//     const COLLECTION_OWNER = 'IAM';
//     const COLLECTION_GROUP = 'users';

//     describe('changePermissions for collection', () => {
//       test('permissions changed successfully for User', async () => {
//         await createCollection(
//           DB_NAME,
//           TEST_COLLECTION,
//           COLLECTION_OWNER,
//           COLLECTION_GROUP,
//           [
//             {
//               name: 'name',
//               kind: 'CircuitString',
//               indexed: true,
//             },
//           ],
//           {
//             permissionOwner: { system: true, read: true },
//           }
//         );

//         await changePermissions(
//           DB_NAME,
//           TEST_COLLECTION,
//           COLLECTION_OWNER,
//           null,
//           'User',
//           {
//             ...ZKDATABASE_NO_PERMISSION_RECORD,
//             write: true,
//           }
//         );

//         const updatedPermissions = await readMetadata(
//           DB_NAME,
//           TEST_COLLECTION,
//           null,
//           COLLECTION_OWNER
//         );

//         expect(updatedPermissions.permissions.permissionOwner).toEqual({
//           ...ZKDATABASE_NO_PERMISSION_RECORD,
//           write: true,
//         });
//       });

//       test('permissions changed successfully for Group', async () => {
//         await createCollection(
//           DB_NAME,
//           TEST_COLLECTION,
//           COLLECTION_OWNER,
//           COLLECTION_GROUP,
//           [
//             {
//               name: 'name',
//               kind: 'CircuitString',
//               indexed: true,
//             },
//           ],
//           {
//             permissionOwner: { system: true, read: true },
//           }
//         );

//         await changePermissions(
//           DB_NAME,
//           TEST_COLLECTION,
//           COLLECTION_OWNER,
//           null,
//           'Group',
//           {
//             ...ZKDATABASE_NO_PERMISSION_RECORD,
//             write: true,
//           }
//         );

//         const updatedPermissions = await readMetadata(
//           DB_NAME,
//           TEST_COLLECTION,
//           null,
//           COLLECTION_OWNER
//         );

//         expect(updatedPermissions.permissions.permissionGroup).toEqual({
//           ...ZKDATABASE_NO_PERMISSION_RECORD,
//           write: true,
//         });
//       });

//       test('permissions changed successfully for Other', async () => {
//         await createCollection(
//           DB_NAME,
//           TEST_COLLECTION,
//           COLLECTION_OWNER,
//           COLLECTION_GROUP,
//           [
//             {
//               name: 'name',
//               kind: 'CircuitString',
//               indexed: true,
//             },
//           ],
//           {
//             permissionOwner: { system: true, read: true },
//           }
//         );

//         await changePermissions(
//           DB_NAME,
//           TEST_COLLECTION,
//           COLLECTION_OWNER,
//           null,
//           'Other',
//           {
//             ...ZKDATABASE_NO_PERMISSION_RECORD,
//             write: true,
//           }
//         );

//         const updatedPermissions = await readMetadata(
//           DB_NAME,
//           TEST_COLLECTION,
//           null,
//           COLLECTION_OWNER
//         );

//         expect(updatedPermissions.permissions.permissionOther).toEqual({
//           ...ZKDATABASE_NO_PERMISSION_RECORD,
//           write: true,
//         });
//       });

//       test('failed as system permission is missed', async () => {
//         await createCollection(
//           DB_NAME,
//           TEST_COLLECTION,
//           COLLECTION_OWNER,
//           COLLECTION_GROUP,
//           [
//             {
//               name: 'name',
//               kind: 'CircuitString',
//               indexed: true,
//             },
//           ],
//           {
//             permissionOwner: { read: true },
//           }
//         );

//         await expect(async () =>
//           changePermissions(
//             DB_NAME,
//             TEST_COLLECTION,
//             COLLECTION_OWNER,
//             null,
//             'User',
//             {
//               ...ZKDATABASE_NO_PERMISSION_RECORD,
//               write: true,
//             }
//           )
//         ).rejects.toBeDefined();
//       });
//     });
//   });
// });
