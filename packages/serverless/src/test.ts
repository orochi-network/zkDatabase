import express from 'express';
import { config } from './helper/config';
import { DatabaseEngine } from './model/abstract/database-engine';
import { Timestamp, WithId } from 'mongodb';

(async () => {
  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  } 

  //console.log(await dbEngine.client.db('test').createCollection('test'));

  /*console.log(await dbEngine.client.db('test').collection('test').insertOne({
    a: new Timestamp(BigInt(Date.now()))
  }));
let b: WithId<{a: Timestamp}> | null= await dbEngine.client.db('test').collection('test').findOne() as any;
if(b){
    console.log(b.a.);
}*/
  
})();