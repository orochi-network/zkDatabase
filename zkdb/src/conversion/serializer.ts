import Long from "long";
import {
    PublicKey,
    UInt32,
    UInt64,
    Signature,
    Int64,
    Encoding
} from 'snarkyjs';
import { boolProps, checkType, fieldProps, groupProps } from "./utils.js";

const regexp = /\x00/; // eslint-disable-line no-control-regex

export class BSONSerializer {
    private buffer: number[];

    constructor() {
        this.buffer = [];
    }

    public writeByte(v: number): void {
        this.buffer.push(v & 0xff);
    }

    public writeBytes(buf: Buffer): void {
        for (let i = 0; i < buf.length; i++) {
            this.writeByte(buf[i]);
        }
    }

    public writeInt32(v: number): void {
        this.buffer.push(v);
        this.buffer.push(v >> 8);
        this.buffer.push(v >> 16);
        this.buffer.push(v >> 24);
    }

    public writeCstring(v: string): void {
        for (let i = 0; i < v.length; i++) {
            this.writeByte(v.charCodeAt(i));
        }
        this.writeByte(0);
    }

    public writeString(v: string): void {
        const buf = Buffer.from(v, 'utf8');
        this.writeInt32(buf.length + 1);
        for (let i = 0; i < buf.length; i++) {
            this.writeByte(buf[i]);
        }
        this.writeByte(0);
    }

    public writeBinary(buf: Buffer): void {
        this.writeInt32(buf.length);
        this.writeByte(0);
        this.writeBytes(buf);
    }

    public writeBoolean(v: Boolean): void {
        const buf = (v === true) ? new Uint8Array([1]) : new Uint8Array([0]);
        this.writeBytes(Buffer.from(buf));
    }

    public writeFloat(v: number): void {
        const tempArray = new Uint8Array(8);

        const dataView = new DataView(tempArray.buffer);

        dataView.setFloat64(0, v, true);

        for (let i = 0; i < 8; i++) {
            this.buffer.push(tempArray[i]);
        }
    }

    public writeBigInt(v: bigint): void {
        const tempArray = new Uint8Array(8);

        const dataView = new DataView(tempArray.buffer);

        dataView.setBigInt64(0, v, true);

        for (let i = 0; i < 8; i++) {
            this.buffer.push(tempArray[i]);
        }
    }

    public writeDate(v: Date): void {
        const dateInMillis = Long.fromNumber(v.getTime());

        const low = dateInMillis.getLowBitsUnsigned();
        const high = dateInMillis.getHighBitsUnsigned();

        this.writeInt32(low);
        this.writeInt32(high);
    }

    public writeRegex(v: RegExp): void {
        if (v.source && v.source.match(regexp) != null) {
            throw new Error('value ' + v.source + ' must not contain null bytes');
        }
        // write the parameters
        const regexString = v.source;
        this.writeCstring(regexString)

        if (v.ignoreCase) this.buffer.push(0x69); // i
        if (v.global) this.buffer.push(0x73); // g
        if (v.multiline) this.buffer.push(0x6d); // m

        // write ending bytes
        this.writeByte(0);
    }

    public writeLong(v: any): void {
        const type = v._bsontype == 'Long' ? 0x12 : 0x11;
        this.writeByte(type);

        const low = (v as Long).getLowBitsUnsigned();
        const high = (v as Long).getHighBitsUnsigned();

        this.writeInt32(low);
        this.writeInt32(high);
    }

    public writeSubBinary(buf: Buffer): void {
        this.writeInt32(buf.byteLength);
        this.writeSubBytes(buf);
        this.writeByte(0);
    }

    public writeSubBytes(buf: Buffer): void {
        for (let i = 0; i < buf.byteLength; i++) {
            this.writeByte(buf[i]);
        }
    }

    public writeFields(v: any, bijective: boolean = true): void {
        const binaryData = bijective ? Encoding.Bijective.Fp.toBytes(v) : Encoding.bytesFromFields(v)
        const buffer = Buffer.alloc(binaryData.byteLength);
        for (let i = 0; i < binaryData.length; ++i) {
            buffer[i] = binaryData[i];
        }
        this.writeSubBinary(buffer)
    }

    public pack(): Buffer {
        const data = Buffer.alloc(this.buffer.length + 5);
        let o = 0;

        data[o++] = ((5 + this.buffer.length) >> 0) & 0xff;
        data[o++] = ((5 + this.buffer.length) >> 8) & 0xff;
        data[o++] = ((5 + this.buffer.length) >> 16) & 0xff;
        data[o++] = ((5 + this.buffer.length) >> 24) & 0xff;

        for (let i = 0; i < this.buffer.length; i++) {
            data[o++] = this.buffer[i];
        }

        data[o++] = 0;

        return data;
    }

    public reset(): void {
        this.buffer = []
    }

    public serialize(object: object): Buffer {
        this.reset()
        for (const k in object) {
            this.serializeItem(k, object[k as keyof typeof object]);
        }

        return this.pack();
    }

    public serializeItem(k: string, v: any): void {
        if (v == null || typeof v == 'undefined') {
            this.writeByte(0x0a);
            this.writeCstring(k);
            return;
        }
        if (checkType(v, fieldProps)) {
            this.writeByte(0x14);
            this.writeCstring(k);
            this.writeFields(v.toFields());
            return;
        }
        if (checkType(v, boolProps)) {
            this.writeByte(0x15);
            this.writeCstring(k);
            this.writeBoolean(v.toBoolean());
            return;
        }
        if (checkType(v, groupProps)) {
            this.writeByte(0x16);
            this.writeCstring(k);
            this.writeBytes(new BSONSerializer().serialize(v.toJSON()));
            return;
        }
        if (v instanceof PublicKey) {
            this.writeByte(0x17)
            this.writeCstring(k);
            this.writeString(v.toBase58())
            return;
        }
        if (v instanceof Int64) {
            this.writeByte(0x18)
            this.writeCstring(k)
            this.writeFields(v.toFields(), false)
            return;
        }
        if (v instanceof UInt32) {
            this.writeByte(0x19)
            this.writeCstring(k);
            this.writeBigInt(v.toBigint())
            return;
        }
        if (v instanceof UInt64) {
            this.writeByte(0x1a)
            this.writeCstring(k);
            this.writeBigInt(v.toBigInt())
            return;
        }
        if (v instanceof Signature) {
            this.writeByte(0x1b)
            this.writeCstring(k);
            // this.writeFields(v.toFields())
            this.writeBytes(new BSONSerializer().serialize(v.toJSON()));
            return;
        }
        if (Array.isArray(v)) {
            this.writeByte(0x04);
            this.writeCstring(k);
            this.writeBytes(new BSONSerializer().serialize(v));
            return;
        }
        if (typeof v == 'string') {
            this.writeByte(0x02);
            this.writeCstring(k);
            this.writeString(v);
            return;
        }
        if (typeof v == 'number') {
            if (Math.round(v) == v) {
                this.writeByte(0x10);
                this.writeCstring(k);
                this.writeInt32(v);
            } else {
                this.writeByte(0x1);
                this.writeCstring(k);
                this.writeFloat(v);
            }
            return;
        }
        if (v instanceof Buffer) {
            this.writeByte(0x05);
            this.writeCstring(k);
            this.writeBinary(v);
            return;
        }
        if (v instanceof Date) {
            this.writeByte(0x09);
            this.writeCstring(k);
            this.writeDate(v);
            return;
        }
        if (v instanceof RegExp) {
            this.writeByte(0x0b);
            this.writeCstring(k);
            this.writeRegex(v);
            return;
        }
        if (typeof v == 'object') {
            this.writeByte(0x03);
            this.writeCstring(k);
            this.writeBytes(new BSONSerializer().serialize(v));
            return;
        }
        if (typeof v == 'boolean') {
            this.writeByte(0x08);
            this.writeCstring(k);
            this.writeBoolean(v);
            return;
        }
        if (typeof v === 'bigint') {
            this.writeByte(0x12);
            this.writeCstring(k);
            this.writeBigInt(v);
            return;
        }
        if (v._bsontype === 'Long' || v._bsontype === 'Timestamp') {
            this.writeCstring(k);
            this.writeLong(v);
            return;
        }
    }
}

