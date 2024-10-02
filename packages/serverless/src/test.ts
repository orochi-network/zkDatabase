import RedisInstance from 'helper/redis';

(async () => {
  RedisInstance.event.on('error', (err) => {
    console.log('error ', err);
  });

  await RedisInstance.connect();
  console.log(
    await RedisInstance.accessTokenDigest(
      'ac5a549fcba1d533b697b9046a81138c26d65ced1805b4c3e7ba0d86e251d371'
    ).get()
  );
})();
