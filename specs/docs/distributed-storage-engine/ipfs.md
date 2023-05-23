# IPFS

IPFS is a distributed protocol that allow you to replicate data among network, you can put a data to IPFS and get those data back as long as it wasn't run out of liveness.

## CID

CID is a unique fingerprint of data you can access the data as long as you know the exactly CID. The CID was calculated by hash function but it isn't data's digest. Instead the CID was calculated by digests of blocks of data.

Combining that hash with codec information about the block using multiformats:

- Multihash for information on the algorithm used to hash the data.
- Multicodec for information on how to interpret the hashed data after it has been fetched.
- Multibase for information on how the hashed data is encoded. Multibase is only used in the string representation of the CID.

In our implementation we use CID v1 and use `SHA256` + `base58`. I supposed that `poseidon` could be better in the long term so we need to make a poseidon proposal to `multihash`.

## IPNS

As we know from above, each DAG node is immutable. In the reality, we want to keep the pointer to the data immutable. [IPNS](https://docs.ipfs.tech/concepts/ipns/) will solve this by provide a permanently pointer (in fact it's a hash of public key).

## Merkle DAG

A Merkle DAG is a DAG where each node has an identifier, and this is the result of hashing the node's contents — any opaque payload carried by the node and the list of identifiers of its children — using a cryptographic hash function like SHA256. This brings some important considerations.

Our data will be stored in sub-merkle DAG. Every time we alter a leaf, it's also change the sub-merkle DAG node and it's required to recompute the CID, this will impact our implementation since we need a metadata file to keep track on CIDs and its children.

## Javascript IPFS

[js-ipfs](https://github.com/ipfs/js-ipfs) paves the way for the Browser implementation of the IPFS protocol. Written entirely in JavaScript, it runs in a Browser, a Service Worker, a Web Extension and Node.js, opening the door to a world of possibilities. Our zkDatabase utilize this package to provide accessibility to data.

We switch to [Helia](https://github.com/ipfs/helia) due to the `js-ipfs` is discontinued.

## libp2p

LibP2p provide building blocks to build p2p application, it handled all p2p network related along side with its modules. It's flexible to use and develop with [libp2p](https://github.com/libp2p/js-libp2p). To config and work with libp2p you need to define:

- Transport: [TCP](https://github.com/libp2p/js-libp2p-tcp), [WebSockets](https://github.com/libp2p/js-libp2p-websockets) these two transports handle the connect in different way. TCP allowed you to handle connect natively but it's required to use `Node.js` run-time instead of browser based. WebSockets module work for both with the lesser performance.
- Encryption: [noise](https://github.com/ChainSafe/js-libp2p-noise), we don't have any option since TLS didn't have any implement for JS.
- Multiplexer: We have two options [mplex](https://github.com/libp2p/js-libp2p-mplex) and [yamux](https://github.com/ChainSafe/js-libp2p-yamux). Multiplexer improve the performance of protocol, node handling. `mplex` is preferable for `tcp` meanwhile `yamux` is prefer for `WebSockets`.
- Node discovery: [KAD DHT](https://github.com/libp2p/js-libp2p-kad-dht) I'm prefer this library to handle node discovery and routing. I'm try the `bootstrap` but it isn't working well that's why you would see I connect the bootstrap nodes directly in the construction.

```ts
const nodeP2p = await createLibp2p(config);
// Manual patch for node bootstrap
const addresses = [
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
].map((e) => multiaddr(e));
for (let i = 0; i < addresses.length; i += 1) {
  await nodeP2p.dial(addresses[i]);
}
await nodeP2p.start();
```

## Helia

[Helia](https://github.com/ipfs/helia) is an new project that handle `ipfs` in modular manner. You can construct a new instance of `Helia` on top of libp2p.

```ts
return createHelia({
  blockstore: new FsBlockstore(
    (<IStorageFileConfiguration>(<any>storage)).location
  ),
  libp2p,
});
```

By passing libp2p instance to Helia, it's highly configurable.

## UnixFS

To handle file I/O, we used [UnixFS](https://github.com/ipfs/helia-unixfs). It can be constructed in the same way that we did with `Helia` but it will take a `Helia` instance instead of `libp2p`.

```ts
const fs = unixfs(heliaNode);
let text = "";
const decoder = new TextDecoder();

let testCID = CID.parse("QmdASJKc1koDd9YczZwAbYWzUKbJU73g6YcxCnDzgxWtp3");
if (testCID) {
  console.log("Read:", testCID);
  for await (const chunk of fs.cat(testCID)) {
    text += decoder.decode(chunk, {
      stream: true,
    });
  }
  console.log(text);
}
```

After do research in `libp2p` and `ipfs` we introduce `StorageEngineIPFS` that handle `ipfs` I/O. The detail is given in [specs](./storage-engine.md). In our implementation, we used `datastore-fs` and `blockstore-fs` to persist changes.
