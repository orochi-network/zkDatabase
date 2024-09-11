---
sidebar_position: 2
---

# Schema

The `Schema` class in zkDatabase defines the structure and behavior of documents within the zkDB system. It provides functionality for serialization, deserialization, and hashing of documents. The `Schema` class leverages the `Struct` class from the `o1js` library to create documents that have cryptographic proof capabilities.

## Key Concepts of Schema

1. **Struct from `o1js`**:
  - The Schema class uses `Struct` from `o1js` to define documents. A `Struct` is a data structure that specifies fields and their types, ensuring that each document adheres to a defined schema.

  - This ensures that all documents created within zkDatabase are compatible with zero-knowledge proof systems, allowing them to be serialized, deserialized, and hashed securely.

2. **Provable Types**:
  - The schema supports only provable types—data types that can be used in cryptographic proofs. These types are part of the o1js library and include `CircuitString`, `UInt32`, `UInt64`, `Bool`, `Sign`, `Character`, `Int64`, `Field`, `PrivateKey`, `PublicKey`, `Signature`, and `MerkleMapWitness`.

  - By restricting documents to provable types, zkDatabase ensures that all data stored is compatible with the cryptographic protocols used in zkApps.

### Supported Provable Types in zkDatabase

The supported provable types and their corresponding classes in `o1js` are as follows:

- **CircuitString**: A string type that can be used in zk circuits.
- **UInt32**, **UInt64**: Unsigned integers of 32 and 64 bits.
- **Int64**: Signed 64-bit integer.
- **Bool**: Boolean value (true/false).
- **Sign**: Represents a sign value (+1 or -1).
- **Character**: Represents a single character.
- **Field**: Represents a finite field element used in zk circuits.
- **PrivateKey**, **PublicKey**: Cryptographic keys used for signing and encryption.
- **Signature**: A cryptographic signature.
- **MerkleMapWitness**: Represents a Merkle proof; however, it is currently not supported for document serialization/deserialization in zkDatabase.

### Creating a Schema

To define a document schema in zkDatabase, you use the `Schema.create` method. This method takes a type definition (a mapping of field names to their types) and an optional list of indexed fields.

**Example: Creating a Schema for a Document**
```ts
class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64
}) {};
```

In this example, the `TShirt` schema defines a document with two fields: `name` (a `CircuitString`) and `price` (a `UInt64`). These fields are provable types from `o1js`, ensuring compatibility with zk circuits.

### Working with Documents
Documents created using the `Schema` class can be serialized, deserialized, and hashed. These operations are critical for maintaining data integrity and security within zkDatabase.

#### Serialization
The `serialize` method converts a document into an encoded format (DocumentEncoded) that can be stored or transmitted.

```ts
const shirt = new TShirt({
  name: CircuitString.fromString('Guchi'),
  price: UInt64.from(12),
});

const encodedShirt = shirt.serialize();
console.log(encodedShirt);
```

#### Deserialization
The `deserialize` method reconstructs a document from its encoded format, converting it back into its original form.

```ts
const decodedShirt = TShirt.deserialize(encodedShirt);
console.log(decodedShirt);
```

#### Hashing
The `hash` method generates a cryptographic hash of the document, which can be used to verify its integrity.

```ts
const hash = shirt.hash();
console.log(hash.toString());
```


## Summary
The Schema class in zkDatabase provides a robust framework for defining, managing, and securing documents using provable types from o1js. With support for serialization, deserialization, hashing the schema system ensures that all data stored in zkDatabase is ready for use in secure and verifiable zkApps.