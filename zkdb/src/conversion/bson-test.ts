import { serializer, deserializer } from './bson.js';
import { BSON } from 'bson';
import {
    Poseidon,
    Field,
    Bool,
    isReady,
    Struct,
    shutdown,
    Group,
    PublicKey,
    UInt32,
    UInt64,
    PrivateKey,
    Signature,
    Int64,
    Encoding
} from 'snarkyjs';

await isReady;


console.log("==============================================================")
console.log("======================Testing SnarkyJS========================")

// Test for serializing SnarkyJS struct
class RandomData extends Struct({
    publicKey: PublicKey,
    uint32: UInt32,
    uint64: UInt64,
    field: Field,
    group: Group,
    bool: Bool,
    signature: Signature,
    int64: Int64
}) {
    constructor(
        publicKey: PublicKey,
        uint32: UInt32,
        uint64: UInt64,
        field: Field,
        group: Group,
        bool: Bool,
        signature: Signature,
        int64: Int64
    ) {
        super({ publicKey, uint32, uint64, field, group, bool, signature, int64 });
        this.publicKey = publicKey;
        this.uint32 = uint32;
        this.uint64 = uint64;
        this.field = field;
        this.group = group;
        this.bool = bool;
        this.signature = signature;
        this.int64 = int64;
    }

    hash(): Field {
        return Poseidon.hash(this.publicKey.toFields().concat(this.uint32.toFields()).concat(this.field.toFields()));
    }

    addPoints(n: number): RandomData {
        return new RandomData(this.publicKey, this.uint32.add(n), this.uint64.add(n), this.field, this.group, this.bool, this.signature, this.int64)
    }
}

let randomAccountPk = PrivateKey.random()
let randAccount = randomAccountPk.toPublicKey()

let msg = Encoding.stringToFields("New signature");
let signature = Signature.create(randomAccountPk, msg);

let bob = new RandomData(randAccount, UInt32.from(5), UInt64.from(6), Field(25), Group.fromFields([Field(134), Field(3)]), Bool(false), signature, Int64.from(57));

console.log("======================Input SnarkyJS========================")

console.log(bob.publicKey.toBase58());
console.log(bob.uint32.toString());
console.log(bob.uint64.toString());
console.log(bob.field.toString());
console.log(bob.group.toJSON());
console.log(bob.bool.toBoolean());
console.log(bob.signature.toJSON());
console.log(bob.int64.toString());

const output = serializer.serialize(bob)

console.log("======================Output SnarkyJS========================")

const data = deserializer.deserialize(output)
//@ts-ignore
const out = Object.assign(new RandomData(), data);
console.log(out.publicKey.toBase58());
console.log(out.uint32.toString());
console.log(out.uint64.toString());
console.log(out.field.toString());
console.log(out.group.toJSON());
console.log(out.bool.toBoolean());
console.log(out.signature.toJSON());
console.log(out.int64.toString());

console.log("==========================================================")
console.log("======================Testing BSON========================")

console.log("Testing against BSON library")

// Test for normal BSON properties
const date = new Date()

const object = {
    key: "value",
    list: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    sub: { list: ["string", "list", 10] },
    status: true,
    magical: 10.6565,
    test_ni: null,
    reg: /w3schools/mig,
    bign: 200n,
    date: date,
    rstring: '^\\w+([.-]?\\w+)*@\\w+([.-]?\\w+)*(\\.\\w{2,3})+$/mgi'
};

console.log("======================Custom Library========================")

const outputv2 = serializer.serialize(object)
console.log(outputv2)

const datav2 = deserializer.deserialize(outputv2)
console.log(datav2)


console.log("======================BSON Library========================")

const output2 = BSON.serialize(object)
console.log(output2)

const data2 = BSON.deserialize(output2)
console.log(data2)

await shutdown()