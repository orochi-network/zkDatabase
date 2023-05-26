# Merkle Tree

To keep our merkle tree verification succinct, efficient and friendly with [SnarkyJS](https://github.com/o1-labs/snarkyjs). A poseidon merkle tree will be used to prove the immutability of the data. The **Sparse Merkle Tree** is utilized as an adaptation of the conventional Merkle Tree.

## Sparse Merkle Tree (SMT)

A Sparse Merkle Tree (SMT) is a variant of a standard Merkle tree that is optimized for scenarios where the data set is very large, but only a small portion of it is populated with values. You could refer to the following article to learn more: [What’s a Sparse Merkle Tree?](https://medium.com/@kelvinfichter/whats-a-sparse-merkle-tree-acda70aeb837).

### Advantages of SMT

Sparse Merkle Trees (SMTs) offer several benefits:

1) **Efficiency**: They allow efficient storage of large, sparse datasets with minimal memory overhead.
2) **Security**: Sparse Merkle Trees (SMTs) share the tamper-proof nature of traditional Merkle Trees, ensuring cryptographic data integrity. However, they also share the same vulnerabilities, such as potential false proofs through hash collisions or second preimage attacks. To mitigate these risks, a strong, collision-resistant hash function is crucial. Additionally, cryptographic commitments to the SMT root can enhance security. With proper implementation, SMTs offer efficient and secure data storage for sparse datasets.
3) **Proof Size**: The proof size for SMTs is consistent, regardless of the tree's size, making them optimal for scenarios where frequent proofs are required.
4) **Flexible Updating**: They support efficient updates and insertions even in massive datasets.

### Ways to store Merkle Tree on IPFS

Here are different ways you could store a Merkle Tree on IPFS:

1) **JSON Serialization**: One of the simplest ways to store a Merkle Tree in IPFS is to convert the Merkle Tree to a JSON structure and then save that to IPFS. This is a straightforward method but can be inefficient for large trees, as the entire tree needs to be retrieved even if you're only interested in certain parts of it.

2) **IPLD (InterPlanetary Linked Data)**: IPLD is a data model and set of coding conventions for linking distributed content on IPFS. By using IPLD, you can create links between any piece of data stored within IPFS. While it involves the concept of DAGs, it provides a more flexible and efficient way to store and retrieve Merkle Trees on IPFS.

3) **BSON Serialization**: BSON, or Binary JSON, extends the popular JSON model to include additional data types such as Date and raw binary data, and allows for a level of efficiency not present in standard JSON. This is because BSON data is a binary representation of JSON-like documents and BSON documents may have elements that are BSON arrays. Storing a Merkle Tree in IPFS using BSON serialization would provide a more space-efficient and potentially faster method for data retrieval compared to JSON, especially for large trees with binary data. Like with JSON, though, the whole tree would need to be retrieved even if you're only interested in certain parts. However, if the Merkle tree's structure can be mapped to a BSON document structure, it might allow for partial tree loading. When using BSON, you need to ensure that the data types you use in your Merkle Tree are compatible with BSON serialization. Some data types may not be supported or may need special handling.

### Storing SMT

Roughly speaking, Sparse Merkle Trees consist of two types of nodes: _filled nodes_ representing actual data, and _zero nodes_ denoting areas of the tree that are unoccupied or sparse.

For effective persistence of a Merkle Tree in any storage medium, three key functions must be executed:

- Storing nodes
- Fetching nodes
- Creating a Merkle Tree proof

All standart merkle tree functions can be implemented along with these 'key' functions.

#### Zero nodes

For each level, zero nodes remain constant and can be generated during the initialization of the Merkle Tree.
```ts
  protected zeroes: Field[];
  
  constructor(height: number) {
    const zeroes = [Field(0)];
    for (let i = 1; i < this.height; i++) {
      zeroes.push(Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]));
    }
    this.zeroes = zeroes;
  }
```

#### Filled nodes

In order to properly store filled nodes, a more advanced approach is needed. As a rule of thumb, every digest must be accompanied by metadata that outlines its position within the tree. This information will assist in the restoration of the node and its associated proof in the future.

Consider the following as an example of how a node might be depicted in IPLD:
```ts
interface IPDLNode {
  level: number;
  index: string;
  hash: Field;
  leftChildCID: CID | null;
  rightChildCID: CID | null;
}
```

### Merkle Proof

A Merkle Proof forms a vital component of the Merkle Tree.

Consider this general interface:
```ts
interface MerkleProof {
  sibling: Field;
  isLeft: boolean; // isLeft = `index` mod 2 == 0
}
```
_sibling_ represents the other child of the parent node while _isLeft_ can be determined by taking the modulus of the node's index by 2.

Merkle proofs can be built in two directions:
- from root to leaf
- from leaf to root

When using IPLD, constructing a Merkle proof _from root to leaf_ is a logical approach since the alternative is less efficient due to the need to initially locate the leaf.

Merkle Proof can be used also to add/update leaves.

### Time complexity

The time complexity for all operation in a distributed SMT is equal to O(n), where **n** is the height of the tree.