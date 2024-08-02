import {
  Field,
  JsonProof,
  PrivateKey,
  Provable,
  PublicKey,
} from 'o1js';
import { ZKDatabase } from './interfaces/database.js';
import {
  collectionExist,
  createCollection,
  createDatabase,
  getDatabaseSettings,
  listGroups,
  getMerkleRoot,
  getProof,
} from '@zkdb/api';
import { DatabaseInfo } from './types/database.js';
import { Group } from './group.js';
import { ZKGroup } from './interfaces/group.js';
import { createGroup } from '@zkdb/api';
import { ZKCollection } from './interfaces/collection.js';
import { ZKCollectionImpl } from './collection.js';
import { DocumentEncoded, SchemaDefinition } from './schema.js';
import { Permissions } from '../types/permission.js';
import { DatabaseContractWrapper } from './smart-contract/database-contract-wrapper.js';

export class ZKDatabaseImpl implements ZKDatabase {
  private databaseName: string;
  private merkleHeight: number;
  private appPublicKey: PublicKey;
  private databaseSmartContract: DatabaseContractWrapper;

  constructor(
    databaseName: string,
    merkleHeight: number,
    appPublicKey: PublicKey,
    databaseSmartContract: DatabaseContractWrapper
  ) {
    this.databaseName = databaseName;
    this.merkleHeight = merkleHeight;
    this.appPublicKey = appPublicKey;
    this.databaseSmartContract = databaseSmartContract;
  }

  static async create(
    databaseName: string,
    merkleHeight: number,
    deployerAddress: PublicKey,
    appKey: PrivateKey
  ): Promise<void> {
    // const databaseSmartContract = DatabaseContractWrapper.getInstance(
    //   databaseName,
    //   merkleHeight,
    //   deployerAddress,
    //   PublicKey.fromPrivateKey(appKey)
    // );

    // await databaseSmartContract.compile();

    // await databaseSmartContract.deploy(appKey);

    
    const result = await createDatabase(
      databaseName,
      merkleHeight,
      'B62qmLTgTZynh12u6r7TrF8h5Gh6KbEyLxUsL6rKM6WqR1ogp3jvmNe'
    );

    if (result.type === 'success') {
      return;
    }

    throw Error(result.message);
  }

  static async getDatabaseSettings(
    databaseName: string
  ): Promise<DatabaseInfo | null> {
    const result = await getDatabaseSettings(databaseName);

    if (result.type === 'success') {
      return result.data;
    } else {
      return null;
    }
  }

  async createGroup(name: string, description: string): Promise<ZKGroup> {
    const result = await createGroup(this.databaseName, name, description);

    if (result.type === 'success') {
      return new Group(this.databaseName, name);
    } else {
      throw Error(result.message);
    }
  }

  group(name: string): ZKGroup {
    return new Group(this.databaseName, name);
  }

  async listGroups(): Promise<ZKGroup[]> {
    const result = await listGroups(this.databaseName);

    if (result.type === 'success') {
      return result.data.map(
        (groupName) => new Group(this.databaseName, groupName)
      );
    } else {
      throw Error(result.message);
    }
  }

  async createCollection(
    collectionName: string,
    groupName: string,
    schemaDefinition: SchemaDefinition,
    permissions: Permissions
  ): Promise<void> {
    const result = await createCollection(
      this.databaseName,
      collectionName,
      groupName,
      schemaDefinition,
      permissions
    );

    if (result.type === 'success') {
      return;
    } else {
      throw Error(result.message);
    }
  }

  async collection<
    T extends {
      new (..._args: any[]): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(collectionName: string, schema: T): Promise<ZKCollection<T>> {
    const collectionExist = await this.collectionExist(collectionName);

    if (collectionExist) {
      return ZKCollectionImpl.loadCollection(
        this.databaseName,
        collectionName,
        schema
      );
    } else {
      throw Error(`Collection ${collectionName} does not exist`);
    }
  }

  async collectionExist(collectionName: string): Promise<boolean> {
    const result = await collectionExist(this.databaseName, collectionName);

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }

  async getRoot(): Promise<Field> {
    const result = await getMerkleRoot(this.databaseName);

    if (result.type === 'success') {
      return Field(result.data);
    } else {
      throw Error(result.message);
    }
  }

  async rollUp(): Promise<void> {
    const proof = await this.getProof();
    Provable.log('proof', proof)
    await this.databaseSmartContract.rollUp(proof);
  }

  async getProof(): Promise<JsonProof> {
    const result = await getProof(this.databaseName);

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }
}
