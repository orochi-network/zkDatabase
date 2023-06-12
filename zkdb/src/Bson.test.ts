import * as zkBson from "./conversion/bson.js";
import { BSON } from 'bson';
import {
    Poseidon,
    Field,
    Bool,
    Struct,
    Group,
    PublicKey,
    UInt32,
    UInt64,
    PrivateKey,
    Signature,
    Int64,
    Encoding,
} from 'snarkyjs';

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

describe('zkBSON Conversion Test', () => {
    let randomData: RandomData

    function randInt(): number {
        const randomValue = Math.random() + 1;
        return Math.floor(randomValue);
    }

    function getBSONRandomData(): RandomData & object {
        const serializedZk = zkBson.serializer.serialize(randomData);
        const deserializedZk = zkBson.deserializer.deserialize(serializedZk);
        //@ts-ignore
        return Object.assign(new RandomData(), deserializedZk);
    }

    beforeEach(() => {
        let randomAccountPk = PrivateKey.random();
        let randAccount = randomAccountPk.toPublicKey();
        let msg = Encoding.stringToFields("Test signature");
        let signature = Signature.create(randomAccountPk, msg);
        randomData = new RandomData(
            randAccount,
            UInt32.from(randInt()),
            UInt64.from(randInt()),
            Field(randInt()),
            Group.fromFields([Field(randInt()), Field(randInt())]),
            Bool(false),
            signature,
            Int64.from(randInt()));
    });

    it('serializes publickey and returns the same public key', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.publicKey).toEqual(randomData.publicKey)
    });

    it('serializes uint32 and returns the same uint32 number', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.uint32).toEqual(randomData.uint32)
    });

    it('serializes uint64 and returns the same uint64 number', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.uint64).toEqual(randomData.uint64)
    });

    it('serializes field and returns the same field', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.field).toEqual(randomData.field)
    });

    it('serializes group data and returns the same group data', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.group).toEqual(randomData.group)
    });

    it('serializes bool and returns the same bool', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.bool).toEqual(randomData.bool)
    });

    it('serializes signature and returns the same signature', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.signature).toEqual(randomData.signature)
    });

    it('serializes int64 and returns the same int64', async () => {
        const returnedRandomData = getBSONRandomData()
        expect(returnedRandomData.int64).toEqual(randomData.int64)
    })
})

describe('Custom Library Test', () => {
    let object: object;
    beforeEach(() => {
        const date = new Date()
        object = {
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
    })

    it('returns same value as normal BSON library', async () => {
        const output = zkBson.serializer.serialize(object)
        const output2 = BSON.serialize(object)
        expect(output).toEqual(output2)
    })
})