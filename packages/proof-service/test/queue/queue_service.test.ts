import { DatabaseEngine, ModelDbSetting, ModelMerkleTree, ModelProof, ModelQueueTask, TaskEntity } from '@zkdb/storage';
import { Field, Poseidon } from 'o1js';
import { config } from '../../src/helper/config';
import QueueService from '../../src/queue/queue-service'

const DB_NAME = 'test-db-document';
const TEST_COLLECTION = 'test-collection';
const MERKLE_HEIGHT = 12;

describe('QueueService', () => {
  let dbEngine: DatabaseEngine;

  beforeAll(async () => {
    dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
    if (!dbEngine.isConnected()) {
      await dbEngine.connect();
    }
  });

  afterAll(async () => {
    await dbEngine.disconnect();
  });

  async function dropDatabases() {
    const adminDb = dbEngine.client.db().admin();
  
    // List all databases
    const { databases } = await adminDb.listDatabases();
  
    // Filter out system databases
    const userDatabases = databases.filter(dbInfo => !['admin', 'local', 'config'].includes(dbInfo.name));
  
    // Drop each user database
    await Promise.all(userDatabases.map(async (dbInfo) => {
      const db = dbEngine.client.db(dbInfo.name);
      await db.dropDatabase();
    }));
  }

  beforeEach(async () => {
    await dropDatabases();
  });

  afterEach(async () => {
    await dropDatabases();
  });

  it('should process tasks correctly and create valid proofs', async () => {
    const queue = ModelQueueTask.getInstance();
    const processor = new QueueService(queue);

    await ModelDbSetting.getInstance(DB_NAME).updateSetting({
      merkleHeight: MERKLE_HEIGHT
    })
    
    const merkleTree = ModelMerkleTree.getInstance(DB_NAME);

    merkleTree.setHeight(MERKLE_HEIGHT);

    // Fill up the queue
    const tasks: TaskEntity[] = [];

    for (let i = 0; i < 2; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000)) 
      const index = BigInt(i);
      const hash = Poseidon.hash(Field(100 + i).toFields())
      
      const currDate = new Date();

      await merkleTree.setLeaf(index, hash, currDate);
      const task = {
        merkleIndex: index,
        hash: hash.toString(),
        database: DB_NAME,
        collection: TEST_COLLECTION,
        createdAt: currDate
      }
      await queue.createTask(task);
      tasks.push(task);
    }

    // Check if task is in the queue and processed is set to FALSE
    let storedTasks = await queue.collection.find({}).toArray();
    expect(storedTasks.length).toEqual(tasks.length);

    storedTasks.forEach(task => {
      expect(task.processed).toBeFalsy();
    });

    expect(storedTasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          // merkleIndex: tasks[0].merkleIndex.toString(),
          hash: tasks[0].hash,
          database: tasks[0].database,
          collection: tasks[0].collection,
          createdAt: tasks[0].createdAt
        }),
        expect.objectContaining({
          // merkleIndex: tasks[1].merkleIndex.toString(),
          hash: tasks[1].hash,
          database: tasks[1].database,
          collection: tasks[1].collection,
          createdAt: tasks[1].createdAt
        }),
      ])
    );

    // Handle tasks
    processor.start()

    while (processor.running) {
      await new Promise((resolve) => setTimeout(resolve, 5000)) 
    }

    // Check if task is in the queue and processed is set to TRUE
    storedTasks = await queue.collection.find({}).toArray();
    expect(storedTasks.length).toEqual(tasks.length);

    storedTasks.forEach(task => {
      expect(task.processed).toBeTruthy();
    });

    // Check if proof is created and saved
    const proofStorage = ModelProof.getInstance();
    const proofs = await proofStorage.collection.find({}).toArray();
    expect(proofs.length).toEqual(2);

    const lastProof = await proofStorage.getProof(DB_NAME, TEST_COLLECTION);
    const merkleRoot = await merkleTree.getRoot(new Date());

    expect(lastProof!.publicOutput[0].toString()).toEqual(merkleRoot.toString());
  });
});
