# IPFS

IPFS is a distributed protocol that allow you to replicate data among network, you can put a data to IPFS and get those data back as long as it wasn't run out of liveness. Data will be stored as blocks and each block will be identified by its digest.

## PeerID

PeerID is a unique identifier of a node in the network. It's a hash of public key of the node. Lip2p2 keypair is handle by its keychain. You can get the PeerID by:

```ts
const libp2p = await createLibp2p({});
libp2p.peerId.toString();
```

## CID

CID is a unique fingerprint of data you can access the data as long as you know the exactly CID. The CID was calculated by hash function but it isn't data's digest. Instead the CID was calculated by digests of blocks of data.

Combining that digest with codec information about the block using multiformats:

- Multihash for information on the algorithm used to hash the data.
- Multicodec for information on how to interpret the hashed data after it has been fetched.
- Multibase for information on how the hashed data is encoded. Multibase is only used in the string representation of the CID.

In our implementation we use CID v1 and use `SHA256` + `base58`. I supposed that `poseidon` could be better in the long term so we need to make a poseidon proposal to `multihash`.

## IPNS

As we know from above, each DAG node is immutable. In the reality, we want to keep the pointer to the data immutable. [IPNS](https://docs.ipfs.tech/concepts/ipns/) will solve this by provide a permanently pointer (in fact it's a hash of public key).

## Merkle DAG

A Merkle DAG is a DAG where each node has an identifier, and this is the result of hashing the node's contents — any opaque payload carried by the node and the list of identifiers of its children — using a cryptographic hash function like SHA256. This brings some important considerations.

Our data will be stored in sub-merkle DAG. Every time we alter a leaf, it's also change the sub-merkle DAG node and it's required to recompute the CID, this will impact our implementation since we need a metadata file to keep track on CIDs and its children.

We can perform a lookup on a merkle DAG by using the CID of the root node. We can also perform a lookup on a sub-merkle DAG by using the CID of the root node of the sub-merkle DAG. DAG traversal is a recursive process that starts at the root node and ends when the desired node is found. This process is cheap and fast, since it only requires the node identifier.

## Javascript IPFS

[js-ipfs](https://github.com/ipfs/js-ipfs) paves the way for the Browser implementation of the IPFS protocol. Written entirely in JavaScript, it runs in a Browser, a Service Worker, a Web Extension and Node.js, opening the door to a world of possibilities.

We switch to [Helia](https://github.com/ipfs/helia) due to the `js-ipfs` is discontinued.

## libp2p

LibP2p provide building blocks to build p2p application, it handled all p2p network related along side with its modules. It's flexible to use and develop with [libp2p](https://github.com/libp2p/js-libp2p). To config and work with libp2p you need to define:

- Transport:
  - [TCP](https://github.com/libp2p/js-libp2p-tcp): TCP transport module help you to manage connection between nodes natively. TCP handles connect at transport layer (layer 4) that's why it's more efficient to maintain connection. But it's only work for `Node.js` run-time.
  - [WebSockets](https://github.com/libp2p/js-libp2p-websockets): WebSocket in contrast to TCP, it's work on application layer (layer 7) that's why it's less efficient to maintain connection. But it's work for both `Node.js` and `Browser`.
- Encryption: [noise](https://github.com/ChainSafe/js-libp2p-noise), we don't have any option since TLS didn't have any implement for JS.
- Multiplexer:
  - [mplex](https://github.com/libp2p/js-libp2p-mplex) `mplex` is a simple stream multiplexer that was designed in the early days of libp2p. It is a simple protocol that does not provide many features offered by other stream multiplexers. Notably, `mplex` does not provide flow control, a feature which is now considered critical for a stream multiplexer. `mplex` runs over a reliable, ordered pipe between two peers, such as a TCP connection. Peers can open, write to, close, and reset a stream. mplex uses a message-based framing layer like yamux, enabling it to multiplex different data streams, including stream-oriented data and other types of messages.
  - [yamux](https://github.com/ChainSafe/js-libp2p-yamux). Yamux (Yet another Multiplexer) is a powerful stream multiplexer used in libp2p. It was initially developed by Hashicorp for Go, and is now implemented in Rust, JavaScript and other languages. enables multiple parallel streams on a single TCP connection. The design was inspired by SPDY (which later became the basis for HTTP/2), however it is not compatible with it. One of the key features of Yamux is its support for flow control through backpressure. This mechanism helps to prevent data from being sent faster than it can be processed. It allows the receiver to specify an offset to which the sender can send data, which increases as the receiver processes the data. This helps prevent the sender from overwhelming the receiver, especially when the receiver has limited resources or needs to process complex data. _**Note**: Yamux should be used over mplex in libp2p, as mplex doesn’t provide a mechanism to apply backpressure on the stream level._
- Node discovery: [KAD DHT](https://github.com/libp2p/js-libp2p-kad-dht) The Kademlia Distributed Hash Table (DHT), or Kad-DHT, is a distributed hash table that is designed for P2P networks. Kad-DHT in libp2p is a subsystem based on the [Kademlia whitepaper](https://docs.libp2p.io/concepts/discovery-routing/kaddht/#:~:text=based%20on%20the-,Kademlia%20whitepaper,-.). Kad-DHT offers a way to find nodes and data on the network by using a [routing table](https://docs.libp2p.io/concepts/discovery-routing/kaddht/#:~:text=by%20using%20a-,routing%20table,-that%20organizes%20peers) that organizes peers based on how similar their keys are.

_**Note:** KAD DHT boostrap didn't work as expected that's why you would see I connect the bootstrap nodes directly in the construction._

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
  blockstore: new FsBlockstore("./local-storage"),
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
