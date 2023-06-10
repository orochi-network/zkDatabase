import Long from "long";
import {
    Field,
    Bool,
    Group,
    PublicKey,
    UInt32,
    UInt64,
    Signature,
    Int64,
    Encoding
} from 'snarkyjs';

const MAXSIZE = 1024 * 1024 * 17

export class BSONDeserializer {
    private offset: number;
    private data: Buffer;
    private length: number;

    constructor() {
        this.offset = 0;
        this.data = Buffer.alloc(MAXSIZE);
    }

    public readByte(): number {
        const v = this.data[this.offset];
        this.offset++;
        return v;
    }

    public readInt64(): Long {
        const low = this.readInt32();
        const high = this.readInt32();
        const v = new Long(low, high);
        return v;
    }

    public readFloat64(): number {
        const tempArray = new Uint8Array(8);

        let offset = this.offset;

        for (let i = 0; i < 8; i++) {
            tempArray[i] = this.data[offset + i];
            this.offset++;
        }

        const dataView = new DataView(tempArray.buffer);
        const v = dataView.getFloat64(0, true);
        return v;
    }

    public readInt32(): number {
        let v = 0;
        v |= this.data[this.offset + 3] << 24;
        v |= this.data[this.offset + 2] << 16;
        v |= this.data[this.offset + 1] << 8;
        v |= this.data[this.offset + 0];
        this.offset += 4;
        return v;
    }

    public readBigInt64(): bigint {
        const tempArray = new Uint8Array(8);

        let offset = this.offset;

        for (let i = 0; i < 8; i++) {
            tempArray[i] = this.data[offset + i];
            this.offset++;
        }

        const dataView = new DataView(tempArray.buffer);
        const v = dataView.getBigInt64(0, true);
        return v;
    }

    public readRegex(): RegExp {
        const string = this.parseCstring()
        let i = this.offset;
        while (this.data[i] !== 0x00 && i < this.data.length) {
            i++;
        }

        const regex_data = this.data.subarray(this.offset, i);
        const regex_array = new Array(regex_data.length);

        // update the offset
        this.offset += i - this.offset + 1;

        // Parse options
        for (let i = 0; i < regex_data.length; i++) {
            switch (regex_data[i]) {
                case 0x73:
                    regex_array[i] = 'g';
                    break;
                case 0x69:
                    regex_array[i] = 'i';
                    break;
                case 0x6d:
                    regex_array[i] = 'm';
                    break;
            }
        }
        const v = new RegExp(string, regex_array.join(''));
        return v
    }

    public reset(data: Buffer): void {
        this.offset = 0;
        this.data = data;
    }

    public deserialize(data: Buffer): object {
        if (!(data instanceof Buffer)) {
            throw new Error("The input type must be a Buffer");
        }
        this.reset(data);
        this.length = this.readInt32();
        this.length -= this.offset;
        return this.deserializeElist();
    }

    private deserializeElist(): object {
        const kv: { [key: string]: any } = {};
        while (this.offset < this.length - 1) {
            const type = this.readByte();

            if (type == 0x00) return kv;

            if (type == 0x01) {
                const k = this.parseCstring();
                const v = this.parseFloat();
                kv[k] = v;
                continue;
            }

            if (type == 0x02) {
                const k = this.parseCstring();
                const v = this.parseString();
                kv[k] = v;
                continue;
            }

            if (type == 0x03 || type == 0x04) {
                const k = this.parseCstring();
                const v = new BSONDeserializer().deserialize(this.data.subarray(this.offset));
                this.offset += this.readInt32();
                if (type == 0x04) {
                    const c: string[] = [];
                    for (const i in v) c.push(v[i as keyof typeof v]);
                    kv[k] = c;
                } else {
                    kv[k] = v;
                }
                continue;
            }

            if (type == 0x05) {
                const k = this.parseCstring();
                const v = this.parseBinary();
                kv[k] = v;
                continue;
            }

            if (type == 0x08) {
                const k = this.parseCstring();
                const v = this.parseBoolean()
                kv[k] = v;
                continue;
            }

            if (type == 0x09) {
                const k = this.parseCstring();
                const v = this.readInt64();
                kv[k] = new Date(v.toNumber());
                continue;
            }

            if (type == 0x0a) {
                const k = this.parseCstring();
                kv[k] = null;
                continue;
            }

            if (type == 0x0b) {
                const k = this.parseCstring();
                kv[k] = this.readRegex();
                continue;
            }

            if (type == 0x10) {
                const k = this.parseCstring();
                const v = this.readInt32();
                kv[k] = v;
                continue;
            }

            if (type == 0x11) {
                const k = this.parseCstring();
                const v = this.readInt64();
                kv[k] = v;
                continue;
            }

            if (type == 0x12) {
                const k = this.parseCstring();
                const v = this.readBigInt64();
                kv[k] = v;
                continue;
            }

            if (type == 0x14) {
                const k = this.parseCstring();
                const fields = this.parseFields();
                let v;
                if (fields.length == 0) v = Field(0)
                else {
                    v = Field.fromFields(fields);
                }
                kv[k] = v
                continue
            }

            if (type == 0x15) {
                const k = this.parseCstring()
                const v = this.parseBoolean()
                kv[k] = Bool(v as boolean);
                continue
            }

            if (type == 0x16) {
                const k = this.parseCstring()
                const v = new BSONDeserializer().deserialize(this.data.subarray(this.offset));
                this.offset += this.readInt32();
                //@ts-ignore
                kv[k] = Group.fromJSON(v);

                continue
            }

            if (type == 0x17) {
                const k = this.parseCstring()
                const v = this.parseString()
                kv[k] = PublicKey.fromBase58(v);
                continue
            }
            if (type == 0x18) {
                const k = this.parseCstring()
                const v = this.parseFields(false)
                kv[k] = Int64.fromFields(v);
                continue
            }
            if (type == 0x19) {
                const k = this.parseCstring()
                const v = this.readBigInt64()
                kv[k] = UInt32.from(v)
                continue
            }
            if (type == 0x1a) {
                const k = this.parseCstring()
                const v = this.readBigInt64()
                kv[k] = UInt64.from(v)
                continue
            }
            if (type == 0x1b) {
                const k = this.parseCstring()
                const v = new BSONDeserializer().deserialize(this.data.subarray(this.offset));
                this.offset += this.readInt32();
                kv[k] = Signature.fromJSON(v)
                continue
            }
            throw new Error('Unrecognized data type 0x' + type.toString(16) + ' @' + this.offset);
        }
        return kv;
    }


    public parseCstring(): string {
        var str = Buffer.alloc(256),
            i;
        for (i = 0; i < 256; i++) {
            var chr = this.readByte();
            if (chr == 0) break;
            str[i] = chr;
        }
        return str.toString('ascii', 0, i);
    }

    public parseString() {
        var len = this.readInt32();
        var str = Buffer.alloc(len),
            i;

        for (i = 0; i < len; i++) {
            str[i] = this.data[this.offset];
            this.offset++;
        }

        return str.toString('utf8', 0, len - 1);
    }

    public parseBinary(): Buffer {
        var len = this.readInt32();
        // var type = this.readByte(); // TODO: sub type is ignored for now
        var str = Buffer.alloc(len),
            i;
        for (i = 0; i < len; i++) {
            str[i] = this.data[this.offset];
            this.offset++;
        }
        return str;
    }

    public parseBoolean(): Boolean {
        var bool = this.readByte()
        return bool == 1;
    }

    public parseFloat(): number {
        return this.readFloat64();
    }

    public parseFields(bijective: boolean = true): Field[] {
        const bin = this.parseBinary();
        const arrayBuffer = new ArrayBuffer(bin.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bin.length; ++i) {
            view[i] = bin[i];
        }
        const fields = bijective ? Encoding.Bijective.Fp.fromBytes(view) : Encoding.bytesToFields(view)
        this.offset++;
        return fields
    }
}